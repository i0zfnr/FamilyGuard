import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
