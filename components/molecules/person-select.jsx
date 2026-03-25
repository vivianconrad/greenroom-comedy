'use client'

import { useId } from 'react'
import { Input } from '@/components/atoms/input'

/**
 * A text input with a datalist suggesting "Me" + series contacts.
 * Still allows free text so the user isn't locked to the list.
 */
export function PersonSelect({ label, name, defaultValue, placeholder, contacts = [], ...props }) {
  const listId = useId()
  const suggestions = ['Me', ...contacts.map((c) => c.name)]

  return (
    <>
      <Input
        label={label}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
        {...props}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  )
}
