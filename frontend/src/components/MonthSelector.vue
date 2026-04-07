<template>
  <div class="d-flex align-center flex-wrap gap-2">
    <!-- Month selector -->
    <v-select
      v-model.number="selectedMonth"
      :items="monthItems"
      item-title="name"
      item-value="value"
      label="ماه"
      variant="outlined"
      density="compact"
      hide-details
      style="min-width: 120px"
    />

    <!-- Year input -->
    <v-text-field
      v-model.number="selectedYear"
      label="سال"
      type="number"
      min="1300"
      max="1500"
      variant="outlined"
      density="compact"
      hide-details
      style="width: 90px"
    />

    <!-- Reset button -->
    <v-btn
      color="grey-lighten-2"
      variant="flat"
      density="comfortable"
      @click="resetToCurrentMonth"
    >
      ماه جاری
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { PERSIAN_MONTHS, getCurrentPersianDate } from '../utils/dateConverter';

const emit = defineEmits(['change']);

const currentPersian = getCurrentPersianDate();
const selectedMonth = ref(currentPersian.month);
const selectedYear = ref(currentPersian.year);

const monthItems = computed(() =>
  PERSIAN_MONTHS.map((name, index) => ({ name, value: index + 1 }))
);

function emitFilter() {
  emit('change', {
    persianYear: Number(selectedYear.value),
    persianMonth: Number(selectedMonth.value)
  });
}

function resetToCurrentMonth() {
  const current = getCurrentPersianDate();
  selectedMonth.value = current.month;
  selectedYear.value = current.year;
  emitFilter();
}

onMounted(() => emitFilter());

watch([selectedMonth, selectedYear], () => {
  emitFilter();
});
</script>
