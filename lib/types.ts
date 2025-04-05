export interface Item {
  id: string
  title: string
  price: number
  description: string
  image?: string
  category: string
  condition: string
  location: string
  status: "available" | "reserved" | "sold"
  createdAt: string
  seller: {
    id: string
    name: string
    department: string
  }
  universityId?: number
  universityName?: string
  universitySlug?: string
}

export interface University {
  id: number
  name: string
  slug: string
  domain?: string
  logoUrl?: string
  officialName?: string
}

export interface UniversityDetails {
  description?: string
  location?: string
  founded_year?: number
  website?: string
  student_count?: number
  logo_url?: string
  official_name?: string
}

export interface User {
  id: string
  name: string
  email: string
  department?: string
  university?: string
  universityId?: number
  universitySlug?: string
  profileImage?: string
  isVerified?: boolean
}

