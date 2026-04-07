<template>
  <v-dialog :model-value="isOpen" max-width="400" persistent @click:outside="$emit('cancel')">
    <v-card rounded="xl" class="pa-6">
      <!-- Icon -->
      <div class="d-flex justify-center mb-4">
        <v-avatar color="red-lighten-4" size="64">
          <v-icon icon="mdi-delete-outline" color="error" size="32" />
        </v-avatar>
      </div>

      <!-- Title -->
      <v-card-title class="text-center text-h6 font-weight-bold pa-0 mb-2">
        {{ title }}
      </v-card-title>

      <!-- Message -->
      <v-card-text class="text-center text-medium-emphasis pa-0 mb-6">
        {{ message }}
      </v-card-text>

      <!-- Buttons -->
      <v-row>
        <v-col cols="6">
          <v-btn
            block
            color="error"
            size="large"
            :loading="loading"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            بله، حذف شود
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn
            block
            color="grey-lighten-2"
            size="large"
            :disabled="loading"
            @click="$emit('cancel')"
          >
            انصراف
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: 'حذف' },
  message: { type: String, default: 'آیا از حذف این مورد اطمینان دارید؟' },
  loading: { type: Boolean, default: false }
});

defineEmits(['confirm', 'cancel']);
</script>
