<template>
  <v-dialog :model-value="isOpen" max-width="480" persistent @click:outside="$emit('close')">
    <v-card rounded="xl">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-5 border-b">
        <span class="text-h6 font-weight-bold">
          {{ isEditMode ? 'ویرایش حساب' : 'افزودن حساب جدید' }}
        </span>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="$emit('close')" />
      </v-card-title>

      <!-- Body -->
      <v-card-text class="pa-5">
        <v-form @submit.prevent>
          <!-- Customer dropdown -->
          <div v-if="!customerId" class="mb-4">
            <div class="d-flex gap-2 align-start">
              <div class="flex-grow-1 position-relative">
                <v-text-field
                  v-model="customerSearch"
                  label="مشتری"
                  placeholder="جستجو یا انتخاب مشتری"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.customer_id"
                  @focus="showDropdown = true"
                  @input="onCustomerInput"
                  @keydown.down.prevent="focusNext()"
                  @keydown.up.prevent="focusPrev()"
                  @keydown.enter.prevent="confirmHighlighted()"
                  @blur="onBlur"
                  :append-inner-icon="form.customer_id ? 'mdi-close' : undefined"
                  @click:append-inner="clearCustomer"
                >
                  <template v-if="form.customer_id" #append-inner>
                    <v-btn icon="mdi-close" size="x-small" variant="text" @click.stop="clearCustomer" />
                  </template>
                </v-text-field>

                <v-list
                  v-if="showDropdown && filteredCustomers.length"
                  class="position-absolute customer-dropdown"
                  elevation="4"
                  rounded="md"
                  density="compact"
                >
                  <v-list-item
                    v-for="(c, idx) in filteredCustomers"
                    :key="c.id"
                    :class="{ 'bg-blue-lighten-5': highlightedIndex === idx }"
                    @mousedown.prevent="selectCustomer(c)"
                  >
                    {{ c.name }}
                  </v-list-item>
                </v-list>

                <v-card
                  v-if="showDropdown && !filteredCustomers.length"
                  class="position-absolute customer-dropdown pa-3"
                  elevation="4"
                >
                  <span class="text-caption text-medium-emphasis">موردی یافت نشد</span>
                </v-card>
              </div>

              <v-btn
                color="success"
                variant="tonal"
                @click="showNewCustomerInput = !showNewCustomerInput"
                class="mt-1"
              >
                + مشتری جدید
              </v-btn>
            </div>

            <!-- Quick add customer input -->
            <div v-if="showNewCustomerInput" class="d-flex gap-2 mt-2">
              <v-text-field
                v-model="newCustomerName"
                placeholder="نام مشتری جدید"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                @keydown.enter.prevent="addNewCustomer"
              />
              <v-btn
                color="success"
                :loading="addingCustomer"
                :disabled="addingCustomer"
                @click="addNewCustomer"
              >
                افزودن
              </v-btn>
            </div>
          </div>

          <!-- Date -->
          <div class="mb-4">
            <div class="text-body-2 font-weight-medium mb-1">
              تاریخ (شمسی) <span class="text-error">*</span>
            </div>
            <JalaliDatePicker v-model="form.persianDate" :error="!!errors.date" />
            <div v-if="errors.date" class="text-error text-caption mt-1">{{ errors.date }}</div>
          </div>

          <!-- Price -->
          <v-text-field
            v-model.number="form.price"
            label="قیمت (تومان)"
            placeholder="مبلغ به تومان"
            type="number"
            min="0"
            step="1000"
            variant="outlined"
            density="comfortable"
            :error-messages="errors.price"
            dir="ltr"
            class="mb-2"
          />
          <div v-if="formattedPrice" class="text-caption text-medium-emphasis mb-4 text-left">{{ formattedPrice }}</div>

          <!-- Buttons -->
          <v-row class="mt-2">
            <v-col cols="6">
              <v-btn
                block
                color="primary"
                size="large"
                :loading="saving"
                :disabled="saving"
                @click="handleSubmit"
              >
                {{ isEditMode ? 'ذخیره تغییرات' : 'افزودن حساب' }}
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                block
                color="grey-lighten-2"
                size="large"
                @click="$emit('close')"
              >
                انصراف
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useInvoiceStore } from '../stores/invoiceStore';
import { toPersianDate, toGregorianDate } from '../utils/dateConverter';
import JalaliDatePicker from './JalaliDatePicker.vue';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  customerId: { type: [Number, String], default: null },
  invoiceData: { type: Object, default: null },
  customersList: { type: Array, default: () => [] }
});

const emit = defineEmits(['save', 'close']);
const toast = useToast();
const invoiceStore = useInvoiceStore();

const isEditMode = computed(() => !!props.invoiceData);
const saving = ref(false);
const showNewCustomerInput = ref(false);
const newCustomerName = ref('');
const addingCustomer = ref(false);

const customerSearch = ref('');
const showDropdown = ref(false);
const highlightedIndex = ref(-1);

const filteredCustomers = computed(() => {
  const q = String(customerSearch.value || '').trim();
  if (!q) return props.customersList.slice(0, 50);
  return props.customersList.filter(c => c.name.includes(q) || c.name.toLowerCase().includes(q.toLowerCase()));
});

const form = reactive({
  customer_id: '',
  persianDate: '',
  price: '',
  description: ''
});

const errors = reactive({
  customer_id: '',
  date: '',
  price: ''
});

const formattedPrice = computed(() => {
  try {
    if (form.price === null || form.price === undefined || form.price === '') return '';
    const n = Number(form.price) || 0;
    if (!n) return '';
    return n.toLocaleString('fa-IR') + ' تومان';
  } catch (e) {
    return '';
  }
});

watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm();
    if (props.invoiceData) {
      form.customer_id = props.invoiceData.customer_id || '';
      form.persianDate = toPersianDate(props.invoiceData.date);
      form.price = props.invoiceData.price || '';
      form.description = props.invoiceData.description || '';
      customerSearch.value = props.invoiceData.customer_name || '';
    } else {
      form.customer_id = props.customerId || '';
      if (props.customerId) {
        const c = props.customersList.find(x => String(x.id) === String(props.customerId));
        customerSearch.value = c ? c.name : '';
      }
    }
  }
});

function resetForm() {
  form.customer_id = '';
  form.persianDate = '';
  form.price = '';
  form.description = '';
  errors.customer_id = '';
  errors.date = '';
  errors.price = '';
  showNewCustomerInput.value = false;
  newCustomerName.value = '';
  customerSearch.value = '';
}

function validate() {
  let valid = true;
  errors.customer_id = '';
  errors.date = '';
  errors.price = '';

  if (!props.customerId && !form.customer_id) {
    errors.customer_id = 'انتخاب مشتری الزامی است';
    valid = false;
  }

  if (!form.persianDate) {
    errors.date = 'تاریخ الزامی است';
    valid = false;
  } else {
    const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
    if (!dateRegex.test(form.persianDate)) {
      errors.date = 'فرمت تاریخ صحیح نیست (YYYY/MM/DD)';
      valid = false;
    }
  }

  if (!form.price || form.price <= 0 || String(form.price).length < 4) {
    errors.price = 'قیمت الزامی است و باید بزرگتر از صفر باشد';
    valid = false;
  }

  return valid;
}

function onCustomerInput() {
  if (!customerSearch.value) {
    form.customer_id = '';
  }
  highlightedIndex.value = -1;
}

function selectCustomer(c) {
  form.customer_id = c.id;
  customerSearch.value = c.name;
  showDropdown.value = false;
}

function clearCustomer() {
  form.customer_id = '';
  customerSearch.value = '';
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false; highlightedIndex.value = -1; }, 150);
}

function focusNext() {
  if (!filteredCustomers.value.length) return;
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredCustomers.value.length - 1);
}

function focusPrev() {
  if (!filteredCustomers.value.length) return;
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
}

function confirmHighlighted() {
  const idx = highlightedIndex.value;
  if (idx >= 0 && idx < filteredCustomers.value.length) selectCustomer(filteredCustomers.value[idx]);
}

async function addNewCustomer() {
  if (!newCustomerName.value.trim()) return;

  addingCustomer.value = true;
  const result = await invoiceStore.addCustomer({ name: newCustomerName.value.trim() });
  addingCustomer.value = false;

  if (result.success) {
    await invoiceStore.fetchCustomers();
    form.customer_id = result.data.id;
    newCustomerName.value = '';
    showNewCustomerInput.value = false;
    toast.success('مشتری جدید اضافه شد');
  } else {
    toast.error(result.message);
  }
}

async function handleSubmit() {
  if (!validate()) return;

  saving.value = true;

  const gregorianDate = toGregorianDate(form.persianDate);

  if (!gregorianDate) {
    errors.date = 'تاریخ وارد شده معتبر نیست';
    saving.value = false;
    return;
  }

  const invoiceData = {
    customer_id: props.customerId || form.customer_id,
    date: gregorianDate,
    price: form.price,
    description: form.description || null
  };

  emit('save', { data: invoiceData, isEdit: isEditMode.value });
  saving.value = false;
}
</script>

<style scoped>
.customer-dropdown {
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}
</style>
