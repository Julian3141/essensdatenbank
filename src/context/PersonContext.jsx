import { createContext, useContext } from 'react'

export const PersonContext = createContext(null)

export function useActivePerson() {
  return useContext(PersonContext)
}
