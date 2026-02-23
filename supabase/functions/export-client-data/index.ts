import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientId, exportType, format } = await req.json()

    if (!clientId || !exportType || !format) {
      throw new Error('Missing required parameters')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch Client Name for filename
    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .select('name, general_assessment')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      throw new Error('Client not found')
    }

    const clientName = clientData.name.replace(/[^a-zA-Z0-9]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    let filename = ''
    let base64Content = ''

    if (exportType === 'session_notes') {
      filename = `${clientName}_SessionNotes_${dateStr}`
      const { data: appointments, error: apptError } = await supabaseClient
        .from('appointments')
        .select(
          `
          schedules (start_time),
          services (name),
          professionals (name),
          notes
        `,
        )
        .eq('client_id', clientId)
        .order('schedules(start_time)', { ascending: false })

      if (apptError) throw apptError

      const notesData =
        appointments
          ?.filter(
            (a: any) => a.notes && Array.isArray(a.notes) && a.notes.length > 0,
          )
          .flatMap((a: any) =>
            a.notes.map((n: any) => ({
              date: n.date,
              service: a.services?.name,
              professional: n.professional_name || a.professionals?.name,
              content: n.content,
            })),
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
          ) || []

      if (format === 'pdf') {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text(`Anotações das Sessões - ${clientData.name}`, 10, 15)
        doc.setFontSize(12)

        let y = 25
        if (notesData.length === 0) {
          doc.text('Nenhuma anotação encontrada.', 10, y)
        } else {
          notesData.forEach((note: any) => {
            if (y > 270) {
              doc.addPage()
              y = 15
            }
            doc.setFont('helvetica', 'bold')
            doc.text(
              `${new Date(note.date).toLocaleDateString('pt-BR')} - ${note.service || 'Serviço'}`,
              10,
              y,
            )
            y += 5
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text(`Profissional: ${note.professional || 'N/A'}`, 10, y)
            y += 5

            const splitText = doc.splitTextToSize(note.content, 180)
            doc.text(splitText, 10, y)
            y += splitText.length * 4 + 10
            doc.setFontSize(12)
          })
        }

        const pdfArrayBuffer = doc.output('arraybuffer')
        base64Content = btoa(
          String.fromCharCode(...new Uint8Array(pdfArrayBuffer)),
        )
        filename += '.pdf'
      } else if (format === 'docx') {
        const children = [
          new Paragraph({
            text: `Anotações das Sessões - ${clientData.name}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '' }), // Spacer
        ]

        if (notesData.length === 0) {
          children.push(new Paragraph({ text: 'Nenhuma anotação encontrada.' }))
        } else {
          notesData.forEach((note: any) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${new Date(note.date).toLocaleDateString('pt-BR')} - ${note.service || 'Serviço'}`,
                    bold: true,
                    size: 28, // 14pt
                  }),
                ],
              }),
              new Paragraph({
                text: `Profissional: ${note.professional || 'N/A'}`,
                size: 20, // 10pt
              }),
              new Paragraph({
                text: note.content,
              }),
              new Paragraph({ text: '' }), // Spacer
            )
          })
        }

        const doc = new Document({
          sections: [
            {
              properties: {},
              children: children,
            },
          ],
        })

        const buffer = await Packer.toBuffer(doc)
        base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        filename += '.docx'
      }
    } else if (exportType === 'general_assessment') {
      filename = `${clientName}_GeneralAssessment_${dateStr}`

      // Parse general assessment
      let assessment = {} as any
      let history = [] as any[]
      const raw = clientData.general_assessment

      if (Array.isArray(raw)) {
        assessment =
          raw.find((i: any) => i.type === 'assessment' || !i.type) || {}
        history = raw.filter((i: any) => i.type === 'imported_history') || []
      } else if (raw && typeof raw === 'object') {
        assessment = raw
      }

      const labels: Record<string, string> = {
        mainComplaint: 'Queixa Principal',
        historyOfPresentIllness: 'História da Doença Atual',
        pastMedicalHistory: 'História Patológica Pregressa',
        medications: 'Medicamentos',
        physicalExam: 'Exame Físico',
        diagnosis: 'Diagnóstico',
        treatmentPlan: 'Plano de Tratamento',
      }

      if (format === 'pdf') {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text(`Avaliação Geral - ${clientData.name}`, 10, 15)

        let y = 25

        // Assessment Fields
        Object.entries(labels).forEach(([key, label]) => {
          const value = assessment[key]
          if (value) {
            if (y > 270) {
              doc.addPage()
              y = 15
            }
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(12)
            doc.text(label, 10, y)
            y += 6
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(11)
            const splitText = doc.splitTextToSize(value, 180)
            doc.text(splitText, 10, y)
            y += splitText.length * 5 + 5
          }
        })

        // History
        if (history.length > 0) {
          if (y > 250) {
            doc.addPage()
            y = 15
          }
          y += 10
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.text('Histórico Importado', 10, y)
          y += 10
          doc.setFontSize(11)

          history.forEach((h: any) => {
            if (y > 270) {
              doc.addPage()
              y = 15
            }
            doc.setFont('helvetica', 'bold')
            doc.text(
              `Importado em: ${new Date(h.date).toLocaleDateString('pt-BR')}`,
              10,
              y,
            )
            y += 5
            doc.setFont('helvetica', 'normal')
            const splitText = doc.splitTextToSize(h.content, 180)
            doc.text(splitText, 10, y)
            y += splitText.length * 5 + 10
          })
        }

        const pdfArrayBuffer = doc.output('arraybuffer')
        base64Content = btoa(
          String.fromCharCode(...new Uint8Array(pdfArrayBuffer)),
        )
        filename += '.pdf'
      } else if (format === 'docx') {
        const children = [
          new Paragraph({
            text: `Avaliação Geral - ${clientData.name}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '' }),
        ]

        Object.entries(labels).forEach(([key, label]) => {
          const value = assessment[key]
          if (value) {
            children.push(
              new Paragraph({
                text: label,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({ text: value }),
            )
          }
        })

        if (history.length > 0) {
          children.push(
            new Paragraph({
              text: 'Histórico Importado',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
          )
          history.forEach((h: any) => {
            children.push(
              new Paragraph({
                text: `Importado em: ${new Date(h.date).toLocaleDateString('pt-BR')}`,
                bold: true,
              }),
              new Paragraph({ text: h.content }),
              new Paragraph({ text: '' }),
            )
          })
        }

        const doc = new Document({
          sections: [
            {
              properties: {},
              children: children,
            },
          ],
        })

        const buffer = await Packer.toBuffer(doc)
        base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        filename += '.docx'
      }
    }

    return new Response(JSON.stringify({ content: base64Content, filename }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
