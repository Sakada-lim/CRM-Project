<template>
  <div class="login-page">
    <v-card class="login-card" elevation="4" rounded="xl">
      <div class="login-brand">
        <div class="brand-mark">BV</div>
        <div>
          <p class="brand-name">Bold Vision</p>
          <p class="brand-tagline">Agent Portal</p>
        </div>
      </div>

      <v-card-text class="px-8 pb-8">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            variant="outlined"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            class="mb-3"
            autocomplete="email"
          />
          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :rules="[(v) => !!v || 'Password is required']"
            class="mb-4"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
          />
          <v-alert v-if="error" type="error" class="mb-4" density="compact" rounded="lg">
            {{ error }}
          </v-alert>
          <v-btn type="submit" block size="large" :loading="loading" class="login-btn">
            Sign in
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { signIn } from '../services/authService'
import { validateEmail } from '../utils/validators'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// "required" + format. validateEmail returns null on success or error string.
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => validateEmail(v) === null || validateEmail(v),
]

async function submit() {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  error.value = ''
  try {
    const { session } = await signIn({ email: email.value, password: password.value })
    authStore.session = session
    authStore.user = session?.user ?? null
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.message || 'Sign in failed. Check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bv-page-bg, #f8fafc);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 32px 32px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #9333ea);
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--bv-text-primary, #0f172a);
  margin: 0;
}

.brand-tagline {
  font-size: 0.8rem;
  color: var(--bv-text-muted, #94a3b8);
  margin: 0;
}

.login-btn {
  background: linear-gradient(135deg, #4f46e5, #9333ea) !important;
  color: white !important;
  font-weight: 600;
}
</style>
