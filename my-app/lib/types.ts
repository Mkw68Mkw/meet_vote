export type VoteValue = "yes" | "no" | "maybe"

export type VoteSelection = {
  date: string
  value: VoteValue
}

export type Vote = {
  name: string
  selections: VoteSelection[]
}

export type Poll = {
  id: string
  title: string
  description?: string
  dates: string[]
  votes: Vote[]
  createdAt: string
}
