import { Professional } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'

interface ProfessionalsListProps {
  professionals: Professional[]
}

export const ProfessionalsList = ({
  professionals,
}: ProfessionalsListProps) => {
  const navigate = useNavigate()

  const handleCardClick = (professionalId: string) => {
    navigate(`/admin/profissionais/${professionalId}`)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {professionals.map((prof) => (
        <Card
          key={prof.id}
          onClick={() => handleCardClick(prof.id)}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={prof.avatar_url || ''} alt={prof.name} />
              <AvatarFallback>{getInitials(prof.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{prof.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{prof.specialty}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {prof.bio || 'Nenhuma biografia disponível.'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
