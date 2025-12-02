import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Client } from '@/types'
import { updateClient } from '@/services/clients'
import { FileText, Loader2, Save } from 'lucide-react'

const assessmentSchema = z.object({
  mainComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  medications: z.string().optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
})

type AssessmentFormValues = z.infer<typeof assessmentSchema>

interface GeneralAssessmentFormProps {
  client: Client
}

export const GeneralAssessmentForm = ({
  client,
}: GeneralAssessmentFormProps) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      mainComplaint: '',
      historyOfPresentIllness: '',
      pastMedicalHistory: '',
      medications: '',
      physicalExam: '',
      diagnosis: '',
      treatmentPlan: '',
    },
  })

  useEffect(() => {
    if (client.general_assessment) {
      form.reset(client.general_assessment as AssessmentFormValues)
    }
  }, [client, form])

  const onSubmit = async (values: AssessmentFormValues) => {
    setIsSubmitting(true)
    const { error } = await updateClient(client.id, {
      general_assessment: values,
    })

    if (error) {
      toast({
        title: 'Erro ao salvar avaliação',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Avaliação atualizada com sucesso!' })
    }
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" /> Avaliação Geral
        </CardTitle>
        <CardDescription>
          Ficha de avaliação fisioterapêutica e anamnese.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mainComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queixa Principal (QP)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a queixa principal do paciente..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="historyOfPresentIllness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>História da Doença Atual (HDA)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Histórico do problema atual..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pastMedicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>História Patológica Pregressa (HPP)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cirurgias, traumas, doenças prévias..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos em Uso</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste os medicamentos..."
                      className="resize-none min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="physicalExam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exame Físico</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações do exame físico (inspeção, palpação, amplitude de movimento, força, testes especiais)..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico Cinético-Funcional</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conclusão diagnóstica..."
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treatmentPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Tratamento</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Objetivos e condutas..."
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Avaliação
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
