import { supabase } from './supabase'

export async function signUp(
  email: string, 
  password: string, 
  targetLanguage: 'french' | 'korean',
  name?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
        target_language: targetLanguage
      }
    }
  })

  if (error) throw error

  // The trigger will automatically create the user profile
  // But we'll keep this as a fallback
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email,
        target_language: targetLanguage,
        name: name || email.split('@')[0],
      }, {
        onConflict: 'id'
      })
    
    if (profileError) {
      console.error('Error creating user profile:', profileError)
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}