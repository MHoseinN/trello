<template>
  <v-container fluid class="fill-height login-bg">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card rounded="xl" elevation="8" class="pa-6">
          <!-- Logo / Title -->
          <div class="text-center mb-6">
            <v-avatar color="blue-lighten-4" size="64" class="mb-4">
              <v-icon icon="mdi-file-document-outline" color="blue" size="32" />
            </v-avatar>
            <div class="text-h6 font-weight-bold">مدیریت حساب‌ها</div>
            <div class="text-caption text-medium-emphasis mt-1">لطفاً وارد حساب کاربری خود شوید</div>
          </div>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin">
            <!-- Username -->
            <v-text-field
              v-model="form.username"
              label="نام کاربری"
              placeholder="نام کاربری را وارد کنید"
              variant="outlined"
              density="comfortable"
              :error-messages="errors.username"
              autocomplete="username"
              class="mb-3"
              prepend-inner-icon="mdi-account-outline"
            />

            <!-- Password -->
            <v-text-field
              v-model="form.password"
              label="رمز عبور"
              placeholder="رمز عبور را وارد کنید"
              type="password"
              variant="outlined"
              density="comfortable"
              :error-messages="errors.password"
              autocomplete="current-password"
              class="mb-3"
              prepend-inner-icon="mdi-lock-outline"
            />

            <!-- Error message -->
            <v-alert
              v-if="loginError"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
              :text="loginError"
            />

            <!-- Submit button -->
            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              :disabled="loading"
            >
              ورود به سیستم
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: ''
});

const errors = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const loginError = ref('');

function validate() {
  errors.username = '';
  errors.password = '';
  let valid = true;

  if (!form.username.trim()) {
    errors.username = 'نام کاربری الزامی است';
    toast.error("نام کاربری را وارد کنید ");
    valid = false;
  }

  if (!form.password) {
    errors.password = 'رمز عبور الزامی است';
    toast.error("رمز عبور را وارد کنید.")
    valid = false;
  }

  return valid;
}

async function handleLogin() {
  if (!validate()) return;

  loading.value = true;
  loginError.value = '';

  const result = await authStore.login(form.username, form.password);

  loading.value = false;

  if (result.success) {
    toast.success('خوش اومدی رئیس');
    router.push('/home');
  } else {
    toast.error("نام کاربری یا رمز عبور اشتباه است");
    loginError.value = result.message || 'نام کاربری یا رمز عبور اشتباه است';
  }
}
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%);
  min-height: 100vh;
}
</style>
