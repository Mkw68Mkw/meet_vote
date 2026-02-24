import type { Poll, Vote } from "./types"

const STORAGE_KEY = "meetvote_polls"

export function getAllPolls(): Poll[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function getPoll(id: string): Poll | null {
  const polls = getAllPolls()
  return polls.find((p) => p.id === id) || null
}

export function savePoll(poll: Poll): void {
  const polls = getAllPolls()
  const existingIndex = polls.findIndex((p) => p.id === poll.id)
  if (existingIndex >= 0) {
    polls[existingIndex] = poll
  } else {
    polls.push(poll)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls))
}

export function addVoteToPoll(pollId: string, vote: Vote): Poll | null {
  const poll = getPoll(pollId)
  if (!poll) return null
  
  // Check if voter already exists (update their vote)
  const existingVoteIndex = poll.votes.findIndex(
    (v) => v.name.toLowerCase() === vote.name.toLowerCase()
  )
  
  if (existingVoteIndex >= 0) {
    poll.votes[existingVoteIndex] = vote
  } else {
    poll.votes.push(vote)
  }
  
  savePoll(poll)
  return poll
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}
