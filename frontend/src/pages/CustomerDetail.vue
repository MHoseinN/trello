<template>
  <div>
    <!-- App Bar -->
    <v-app-bar color="white" elevation="1" :dir="'rtl'">
      <template #prepend>
        <v-btn icon="mdi-chevron-right" class="ms-1" @click="goBack" />
      </template>
      <v-app-bar-title>
        <span class="font-weight-bold">{{ customer?.name || 'مشتری' }}</span>
        <span class="text-caption text-medium-emphasis ms-2">مشاهده فاکتورهای مشتری</span>
      </v-app-bar-title>
      <template #append>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="me-3"
          @click="openAddModal"
        >
          افزودن فاکتور
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <!-- Search Row -->
        <v-card rounded="xl" class="mb-5 pa-4">
          <div class="d-flex align-center justify-center flex-wrap gap-3">
            <div style="width: 200px">
              <JalaliDatePicker v-model="searchDate" />
            </div>
            <v-btn color="primary" variant="flat" @click="performSearch">جستجو</v-btn>
            <v-btn color="grey-lighten-2" variant="flat" @click="clearSearch">پاک کردن</v-btn>
            <v-btn
              :color="unsettledOnly ? 'amber' : 'grey-lighten-2'"
              variant="flat"
              @click="toggleUnsettledCustomer"
            >
              تسویه‌نشده
            </v-btn>
          </div>
        </v-card>

        <!-- Stats -->
        <v-row class="mb-5">
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-h5 font-weight-bold text-blue">{{ invoiceStore.currentInvoices.length }}</div>
              <div class="text-caption text-medium-emphasis mt-1">تعداد فاکتورها</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-h5 font-weight-bold text-green">{{ settledCount }}</div>
              <div class="text-caption text-medium-emphasis mt-1">تسویه شده</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="3">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-body-1 font-weight-bold text-green">{{ settledAmountFormatted }}</div>
              <div class="text-caption text-medium-emphasis mt-1">مبلغ تسویه شده</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="3">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-body-1 font-weight-bold text-orange">{{ remainingAmountFormatted }}</div>
              <div class="text-caption text-medium-emphasis mt-1">مبلغ تسویه نشده</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Invoice Table -->
        <v-card rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between px-5 py-4 border-b">
            <span class="font-weight-semibold text-body-1">فاکتورها</span>
            <span class="text-caption text-medium-emphasis">{{ invoiceStore.currentInvoices.length }} فاکتور</span>
          </v-card-title>

          <div v-if="invoiceStore.loading" class="d-flex flex-column align-center justify-center py-16 gap-3">
            <v-progress-circular indeterminate color="primary" size="48" />
            <span class="text-medium-emphasis">در حال بارگذاری...</span>
          </div>

          <InvoiceTable
            v-else
            :invoices="invoiceStore.currentInvoices"
            :show-customer-column="false"
            :show-actions="true"
            @edit="openEditModal"
            @delete="openDeleteModal"
          />
        </v-card>
      </v-container>
    </v-main>

    <!-- Invoice Form Modal -->
    <InvoiceForm
      :is-open="showInvoiceForm"
      :customer-id="customerId"
      :invoice-data="selectedInvoice"
      :customers-list="[]"
      @save="handleSaveInvoice"
      @close="closeInvoiceForm"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :is-open="showConfirmDelete"
      title="حذف فاکتور"
      message="آیا از حذف این فاکتور اطمینان دارید؟ این عملیات قابل بازگشت نیست."
      :loading="deleting"
      @confirm="handleDeleteInvoice"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useInvoiceStore } from '../stores/invoiceStore';

import InvoiceTable from '../components/InvoiceTable.vue';
import InvoiceForm from '../components/InvoiceForm.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import JalaliDatePicker from '../components/JalaliDatePicker.vue';
import { toGregorianDate } from '../utils/dateConverter';

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const router = useRouter();
const toast = useToast();
const invoiceStore = useInvoiceStore();

const customerId = computed(() => parseInt(props.id));
const customer = ref(null);
const showInvoiceForm = ref(false);
const selectedInvoice = ref(null);
const showConfirmDelete = ref(false);
const deleteTargetId = ref(null);
const deleting = ref(false);
const searchDate = ref('');
const unsettledOnly = ref(false);

const settledCount = computed(() =>
  invoiceStore.currentInvoices.filter(i => i.is_settled).length
);

const settledAmount = computed(() => {
  return invoiceStore.currentInvoices
    .filter(i => i.is_settled)
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0);
});

const settledAmountFormatted = computed(() => {
  return settledAmount.value.toLocaleString('fa-IR') + ' تومان';
});

const remainingAmount = computed(() =>
  invoiceStore.currentInvoices
    .filter(i => !i.is_settled)
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0)
);
const remainingAmountFormatted = computed(() =>
  remainingAmount.value.toLocaleString('fa-IR') + ' تومان'
);

onMounted(async () => {
  await loadCustomerInvoices();
});

async function loadCustomerInvoices() {
  try {
    customer.value = await invoiceStore.fetchCustomerInvoices(customerId.value);
  } catch (err) {
    toast.error('خطا در بارگذاری فاکتورهای مشتری');
    if (err.response?.status === 404) {
      router.push('/home');
    }
  }
}

async function handleSearch(params) {
  if (Object.keys(params).length === 0) {
    await loadCustomerInvoices();
  } else {
    try {
      await invoiceStore.searchInvoices({ ...params, customer_id: customerId.value });
    } catch (err) {
      toast.error('خطا در جستجو');
    }
  }
}

async function performSearch() {
  if (!searchDate.value) {
    await handleSearch({});
    return;
  }
  const greg = toGregorianDate(searchDate.value);
  if (!greg) {
    toast.error('تاریخ انتخاب شده نامعتبر است');
    return;
  }
  try {
    await invoiceStore.searchInvoices({ start_date: greg, end_date: greg, customer_id: customerId.value });
  } catch (err) {
    toast.error('خطا در جستجو');
  }
}

async function clearSearch() {
  searchDate.value = '';
  await handleSearch({});
}

async function toggleUnsettledCustomer() {
  unsettledOnly.value = !unsettledOnly.value;
  if (unsettledOnly.value) {
    await loadCustomerInvoices();
    invoiceStore.currentInvoices = invoiceStore.currentInvoices.filter(i => !i.is_settled);
  } else {
    await loadCustomerInvoices();
  }
}

function openAddModal() {
  selectedInvoice.value = null;
  showInvoiceForm.value = true;
}

function openEditModal(invoice) {
  selectedInvoice.value = invoice;
  showInvoiceForm.value = true;
}

function closeInvoiceForm() {
  showInvoiceForm.value = false;
  selectedInvoice.value = null;
}

function openDeleteModal(invoiceId) {
  deleteTargetId.value = invoiceId;
  showConfirmDelete.value = true;
}

async function handleSaveInvoice({ data, isEdit }) {
  let result;
  if (isEdit && selectedInvoice.value) {
    result = await invoiceStore.updateInvoice(selectedInvoice.value.id, data);
    if (result.success) {
      toast.success('فاکتور با موفقیت ویرایش شد');
    } else {
      toast.error(result.message);
      return;
    }
  } else {
    result = await invoiceStore.addInvoice(data);
    if (result.success) {
      toast.success('فاکتور با موفقیت اضافه شد');
    } else {
      toast.error(result.message);
      return;
    }
  }
  closeInvoiceForm();
  await loadCustomerInvoices();
}

async function handleDeleteInvoice() {
  if (!deleteTargetId.value) return;
  deleting.value = true;
  const result = await invoiceStore.deleteInvoice(deleteTargetId.value);
  deleting.value = false;
  if (result.success) {
    toast.success('فاکتور با موفقیت حذف شد');
    showConfirmDelete.value = false;
    deleteTargetId.value = null;
    await loadCustomerInvoices();
  } else {
    toast.error(result.message);
  }
}

function goBack() {
  router.push('/home');
}
</script>
