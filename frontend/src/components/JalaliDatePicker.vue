<template>
  <div class="position-relative">
    <v-text-field
      :model-value="displayValue"
      @click="openCalendar"
      readonly
      placeholder="تاریخ(شمسی)"
      variant="outlined"
      density="comfortable"
      :error="error"
      prepend-inner-icon="mdi-calendar"
      hide-details="auto"
    />

    <v-card
      v-if="show"
      class="position-absolute jalali-calendar"
      elevation="8"
      rounded="lg"
    >
      <!-- Header -->
      <div class="d-flex align-center justify-space-between pa-3 border-b">
        <v-btn icon="mdi-chevron-right" variant="text" density="compact" @click="prevMonth" />
        <span class="text-body-2 font-weight-medium">{{ monthLabel }} {{ currentYear }}</span>
        <v-btn icon="mdi-chevron-left" variant="text" density="compact" @click="nextMonth" />
      </div>

      <!-- Week days -->
      <div class="calendar-grid pa-2">
        <div v-for="d in weekDays" :key="d" class="calendar-cell text-center text-caption text-medium-emphasis font-weight-medium">
          {{ d }}
        </div>

        <!-- Blank cells -->
        <div v-for="blank in blanks" :key="`b-${blank}`" class="calendar-cell" />

        <!-- Day cells -->
        <button
          v-for="day in daysInMonth"
          :key="day"
          class="calendar-cell calendar-day"
          :class="{ 'selected': selectedDay === day }"
          @click="selectDay(day)"
        >
          {{ day }}
        </button>
      </div>

      <!-- Close -->
      <div class="d-flex justify-end pa-2 border-t">
        <v-btn color="error" variant="text" size="small" @click="closeCalendar">بستن</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import PersianDate from 'persian-date';
import { PERSIAN_MONTHS } from '../utils/dateConverter';

const props = defineProps({
  modelValue: { type: String, default: '' },
  error: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const show = ref(false);
const currentYear = ref(null);
const currentMonth = ref(null);
const selectedDay = ref(null);
const displayValue = ref('');

const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function parseModel(val) {
  if (!val) return null;
  const m = String(val).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function formatPersian(y, m, d) {
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
}

watch(() => props.modelValue, (v) => {
  const p = parseModel(v);
  if (p) {
    currentYear.value = p.y;
    currentMonth.value = p.m;
    selectedDay.value = p.d;
    displayValue.value = formatPersian(p.y, p.m, p.d);
  } else {
    const pd = new PersianDate();
    currentYear.value = pd.year();
    currentMonth.value = pd.month();
    selectedDay.value = null;
    displayValue.value = '';
  }
});

onMounted(() => {
  const p = parseModel(props.modelValue);
  if (p) {
    currentYear.value = p.y;
    currentMonth.value = p.m;
    selectedDay.value = p.d;
    displayValue.value = formatPersian(p.y, p.m, p.d);
  } else {
    const pd = new PersianDate();
    currentYear.value = pd.year();
    currentMonth.value = pd.month();
  }
});

const monthLabel = computed(() => PERSIAN_MONTHS[currentMonth.value - 1] || '');

const daysInMonth = computed(() => {
  try {
    const nextMonth = currentMonth.value === 12 ? 1 : currentMonth.value + 1;
    const nextYear = currentMonth.value === 12 ? currentYear.value + 1 : currentYear.value;
    const endPd = new PersianDate([nextYear, nextMonth, 1]).subtract('day', 1);
    const len = endPd.date();
    return Array.from({ length: len }, (_, i) => i + 1);
  } catch (e) {
    return [];
  }
});

const blanks = computed(() => {
  try {
    const startPd = new PersianDate([currentYear.value, currentMonth.value, 1]);
    const startGreg = startPd.toCalendar('gregorian').toLocale('en').format('YYYY-MM-DD');
    const d = new Date(startGreg);
    const jsWeekday = d.getDay();
    const persianWeekIndex = (jsWeekday + 1) % 7;
    return Array.from({ length: persianWeekIndex }, (_, i) => i);
  } catch (e) {
    return [];
  }
});

function openCalendar() { show.value = true; }
function closeCalendar() { show.value = false; }

function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value -= 1;
    currentMonth.value = 12;
  } else {
    currentMonth.value -= 1;
  }
}
function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value += 1;
    currentMonth.value = 1;
  } else {
    currentMonth.value += 1;
  }
}

function selectDay(day) {
  selectedDay.value = day;
  const val = formatPersian(currentYear.value, currentMonth.value, day);
  displayValue.value = val;
  emit('update:modelValue', val);
  show.value = false;
}
</script>

<style scoped>
.jalali-calendar {
  top: 100%;
  left: 0;
  z-index: 200;
  width: 260px;
  background: white;
  margin-top: 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-cell {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.calendar-day {
  border-radius: 6px;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background 0.15s;
}

.calendar-day:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.calendar-day.selected {
  background: rgb(var(--v-theme-primary));
  color: white;
}
</style>
