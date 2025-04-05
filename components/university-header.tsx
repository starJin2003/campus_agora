"use client"

import { School, MapPin, Calendar, Globe, Users } from "lucide-react"

interface UniversityHeaderProps {
  universityName: string
  universityDetails?: {
    description?: string
    location?: string
    founded_year?: number
    website?: string
    student_count?: number
    logo_url?: string
    official_name?: string // 공식 명칭 추가
  }
}

export default function UniversityHeader({ universityName, universityDetails }: UniversityHeaderProps) {
  if (!universityName) return null

  // 공식 명칭이 있으면 사용, 없으면 일반 이름 사용
  const officialName = universityDetails?.official_name || universityName

  return (
    <div className="bg-primary/10 p-6 rounded-lg mb-6">
      <div className="flex flex-col items-center justify-center mb-2">
        <School className="h-10 w-10 text-primary mb-2" />
        <h2 className="text-2xl font-bold text-primary text-center">Campus Agora</h2>
        <h3 className="text-xl font-semibold text-primary/90 text-center mt-1">{officialName}</h3>

        {universityDetails?.description && (
          <p className="text-sm text-center text-primary/80 mt-2 max-w-2xl">{universityDetails.description}</p>
        )}

        {universityDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {universityDetails.location && (
              <div className="flex flex-col items-center">
                <MapPin className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-primary/80">{universityDetails.location}</span>
              </div>
            )}

            {universityDetails.founded_year && (
              <div className="flex flex-col items-center">
                <Calendar className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-primary/80">설립: {universityDetails.founded_year}</span>
              </div>
            )}

            {universityDetails.website && (
              <div className="flex flex-col items-center">
                <Globe className="h-4 w-4 text-primary mb-1" />
                <a
                  href={universityDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary/80 hover:text-primary"
                >
                  웹사이트
                </a>
              </div>
            )}

            {universityDetails.student_count && (
              <div className="flex flex-col items-center">
                <Users className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-primary/80">
                  학생 수: {universityDetails.student_count.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

