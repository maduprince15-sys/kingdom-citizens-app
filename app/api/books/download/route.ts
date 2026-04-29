import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  if (!bookId) {
    return NextResponse.json({ error: 'Missing book id.' }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = ['owner', 'admin'].includes(profile?.role || '')

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title, pdf_path')
    .eq('id', bookId)
    .single()

  if (bookError || !book || !book.pdf_path) {
    return NextResponse.json({ error: 'PDF not found.' }, { status: 404 })
  }

  if (!isAdmin) {
    const { data: access } = await supabase
      .from('book_access')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!access) {
      return NextResponse.json(
        { error: 'You are not approved to download this book.' },
        { status: 403 }
      )
    }
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('book-pdfs')
    .createSignedUrl(book.pdf_path, 60)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: signedUrlError?.message || 'Could not create download link.' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(signedUrlData.signedUrl)
}