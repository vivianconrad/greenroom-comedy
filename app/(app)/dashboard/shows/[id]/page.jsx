import { notFound } from 'next/navigation'
import { getShowDetail } from '@/lib/queries/show'
import { ShowPageLayout } from '@/components/show/show-page-layout'

export default async function ShowPage({ params, searchParams }) {
  const { id } = await params
  const { tab = 'dashboard' } = await searchParams

  const show = await getShowDetail(id)
  if (!show) notFound()

  return <ShowPageLayout show={show} activeTab={tab} />
}
