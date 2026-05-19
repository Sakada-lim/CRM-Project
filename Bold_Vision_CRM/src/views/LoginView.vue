<template>
  <div class="login-page">
    <div class="login-card">
      <header class="login-brand">
        <img src="@/assets/logo.jpg" alt="Bold Vision Properties" class="login-logo" />
        <p class="login-tagline">Bold Vision</p>
      </header>

      <v-form ref="form" class="login-form" @submit.prevent="submit">
        <div class="field">
          <label for="login-email" class="field-label">Email</label>
          <v-text-field
            id="login-email"
            v-model="email"
            type="email"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            autocomplete="email"
            class="login-input"
          />
        </div>

        <div class="field">
          <label for="login-password" class="field-label">Password</label>
          <v-text-field
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :rules="[(v) => !!v || 'Password is required']"
            autocomplete="current-password"
            class="login-input"
            @click:append-inner="showPassword = !showPassword"
          />
        </div>

        <v-alert
          v-if="initError"
          type="warning"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="login-alert"
        >
          <div class="login-alert__body">{{ initError }}</div>
          <v-btn
            size="small"
            variant="tonal"
            :loading="retrying"
            @click="retryInit"
          >
            Retry connection
          </v-btn>
        </v-alert>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="login-alert"
        >
          {{ error }}
        </v-alert>

        <button
          type="submit"
          class="btn btn-primary login-submit"
          :disabled="loading"
        >
          <span v-if="!loading">Sign in</span>
          <span v-else class="login-submit__loading">
            <v-progress-circular indeterminate size="18" width="2" />
            Signing in…
          </span>
        </button>
      </v-form>

      <footer class="login-foot">
        <span>Bold Vision Properties</span>
        <span class="dot">·</span>
        <span>CRM</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/authStore'
import { signIn } from '../services/authService'
import { validateEmail } from '../utils/validators'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { initError } = storeToRefs(authStore)

const form = ref()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const retrying = ref(false)
const error = ref('')

async function retryInit() {
  retrying.value = true
  try {
    await authStore.init()
    if (authStore.session) {
      router.push(safeRedirect(route.query.redirect))
    }
  } finally {
    retrying.value = false
  }
}

// H14: only accept single-leading-slash absolute paths. Reject protocol-relative
// ('//evil.com'), backslash variants, and non-strings — otherwise a crafted
// /login?redirect=https://evil.com would bounce signed-in users to an attacker.
function safeRedirect(input) {
  if (typeof input !== 'string') return '/'
  if (!input.startsWith('/')) return '/'
  if (input.startsWith('//') || input.startsWith('/\\')) return '/'
  return input
}

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
    router.push(safeRedirect(route.query.redirect))
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
  padding: 24px;
  background:
    radial-gradient(80% 60% at 50% 0%, var(--accent-soft) 0%, transparent 60%),
    radial-gradient(60% 40% at 100% 100%, var(--warm-soft) 0%, transparent 60%),
    var(--bg);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  padding: 36px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 4px;
}

.login-logo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.login-tagline {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tighten Vuetify outlined field to fit token palette */
.login-input :deep(.v-field) {
  border-radius: var(--r-md);
  background: var(--surface-2);
}
.login-input :deep(.v-field__outline__start),
.login-input :deep(.v-field__outline__notch),
.login-input :deep(.v-field__outline__end) {
  border-color: var(--border) !important;
}
.login-input :deep(.v-field--focused .v-field__outline__start),
.login-input :deep(.v-field--focused .v-field__outline__notch),
.login-input :deep(.v-field--focused .v-field__outline__end) {
  border-color: var(--accent) !important;
}
.login-input :deep(.v-field__input) { color: var(--text); }
.login-input :deep(.v-field__prepend-inner .v-icon),
.login-input :deep(.v-field__append-inner .v-icon) { color: var(--text-muted); }

.login-alert {
  margin: 0;
}
.login-alert__body { margin-bottom: 8px; }

.login-submit {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-top: 4px;
}
.login-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.login-submit__loading {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--text-on-accent);
}

.login-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}
.login-foot .dot { opacity: 0.6; }

@media (max-width: 480px) {
  .login-card { padding: 28px 22px 20px; }
  .login-logo { width: 80px; height: 80px; }
}
</style>
