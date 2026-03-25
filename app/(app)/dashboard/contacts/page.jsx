import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllContactsData } from '@/lib/queries/contacts'
import { ContactsPage } from '@/components/organisms/contacts/contacts-page'

export const metadata = {
  title: 'Contacts — Greenroom',
}

export default async function ContactsRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { contacts, performers, allSeries } = await getAllContactsData(user.id)
  const total = contacts.length + performers.length

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-deep">Contacts</h1>
          <p className="text-sm font-body text-soft mt-1">
            <span className="font-semibold text-deep">{total}</span>{' '}
            {total === 1 ? 'contact' : 'contacts'}
          </p>
        </div>
      </div>

      <ContactsPage
        contacts={contacts}
        performers={performers}
        allSeries={allSeries}
      />
    </div>
  )
}
