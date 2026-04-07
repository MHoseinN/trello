<template>
  <div>
    <!-- App Bar -->
    <v-app-bar color="white" elevation="1" :dir="'rtl'">
      <template #prepend>
        <v-avatar color="blue-lighten-4" size="40" class="ms-3">
          <v-icon icon="mdi-file-document-outline" color="blue" />
        </v-avatar>
      </template>
      <v-app-bar-title>
        <span class="font-weight-bold">مدیریت حساب‌ها</span>
        <span class="text-caption text-medium-emphasis ms-2">صفحه اصلی</span>
      </v-app-bar-title>
      <template #append>
        <v-btn
          color="error"
          variant="text"
          prepend-icon="mdi-logout"
          @click="handleLogout"
          class="me-2"
        >
          خروج
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <!-- Controls Row -->
        <v-card rounded="xl" class="mb-6 pa-4">
          <v-row align="center" :no-gutters="false">
            <!-- Month selector -->
            <v-col cols="12" sm="auto">
              <MonthSelector @change="handleMonthChange" />
            </v-col>

            <!-- Date search -->
            <v-col cols="12" sm="auto">
              <div class="d-flex align-center gap-2 flex-wrap">
                <div style="width: 180px">
                  <JalaliDatePicker v-model="searchDate" />
                </div>
                <v-btn color="primary" variant="flat" @click="performSearch">جستجو</v-btn>
                <v-btn color="grey-lighten-2" variant="flat" @click="clearSearch">پاک کردن</v-btn>
                <v-btn
                  :color="unsettledOnly ? 'amber' : 'grey-lighten-2'"
                  :variant="unsettledOnly ? 'flat' : 'flat'"
                  @click="toggleUnsettledMain"
                >
                  تسویه‌نشده
                </v-btn>
              </div>
            </v-col>

            <v-spacer />

            <!-- Add button -->
            <v-col cols="12" sm="auto">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openAddModal"
              >
                افزودن حساب جدید
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- Summary Stats -->
        <v-row class="mb-6">
          <v-col cols="6" sm="auto" style="flex: 1">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-h5 font-weight-bold text-blue">{{ totalAccountsCount }}</div>
              <div class="text-caption text-medium-emphasis mt-1">تعداد حساب‌ها</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="auto" style="flex: 1">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-h5 font-weight-bold text-green">{{ shippedCount }}</div>
              <div class="text-caption text-medium-emphasis mt-1">ارسال شده</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="auto" style="flex: 1">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-h5 font-weight-bold text-purple">{{ settledCount }}</div>
              <div class="text-caption text-medium-emphasis mt-1">تسویه شده</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="auto" style="flex: 1">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-body-1 font-weight-bold text-green">{{ settledAmountFormatted }}</div>
              <div class="text-caption text-medium-emphasis mt-1">مبلغ تسویه شده</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="auto" style="flex: 1">
            <v-card rounded="xl" class="text-center pa-4">
              <div class="text-body-1 font-weight-bold text-red">{{ remainingAmountFormatted }}</div>
              <div class="text-caption text-medium-emphasis mt-1">مبلغ تسویه نشده</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Invoice Table -->
        <v-card rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between px-5 py-4 border-b">
            <span class="font-weight-semibold text-body-1">حساب‌های {{ currentMonthLabel }}</span>
            <span class="text-caption text-medium-emphasis">{{ invoiceStore.currentInvoices.length }} حساب</span>
          </v-card-title>

          <!-- Loading -->
          <div v-if="invoiceStore.loading" class="d-flex flex-column align-center justify-center py-16 gap-3">
            <v-progress-circular indeterminate color="primary" size="48" />
            <span class="text-medium-emphasis">در حال بارگذاری...</span>
          </div>

          <InvoiceTable
            v-else
            :invoices="invoiceStore.currentInvoices"
            :show-customer-column="true"
            :show-actions="true"
            @edit="openEditModal"
            @delete="openDeleteModal"
            @status-change="handleStatusChange"
            @customer-click="navigateToCustomer"
          />
        </v-card>
      </v-container>
    </v-main>

    <!-- Invoice Form Modal -->
    <InvoiceForm
      :is-open="showInvoiceForm"
      :customer-id="null"
      :invoice-data="selectedInvoice"
      :customers-list="invoiceStore.customers"
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
import { useAuthStore } from '../stores/authStore';
import { useInvoiceStore } from '../stores/invoiceStore';
import { PERSIAN_MONTHS, getPersianMonthGregorianRange } from '../utils/dateConverter';

import MonthSelector from '../components/MonthSelector.vue';
import InvoiceTable from '../components/InvoiceTable.vue';
import InvoiceForm from '../components/InvoiceForm.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import JalaliDatePicker from '../components/JalaliDatePicker.vue';
import { toGregorianDate } from '../utils/dateConverter';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const invoiceStore = useInvoiceStore();

const showInvoiceForm = ref(false);
const selectedInvoice = ref(null);
const showConfirmDelete = ref(false);
const deleteTargetId = ref(null);
const deleting = ref(false);
const currentFilter = ref({ persianYear: null, persianMonth: null });
const searchDate = ref('');
const unsettledOnly = ref(false);

const totalAccountsCount = computed(() => invoiceStore.allInvoices.length);

const shippedCount = computed(() =>
  invoiceStore.allInvoices.filter(i => i.is_shipped).length
);

const settledCount = computed(() =>
  invoiceStore.allInvoices.filter(i => i.is_settled).length
);

const settledAmount = computed(() =>
  invoiceStore.allInvoices
    .filter(i => i.is_settled)
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0)
);

const remainingAmount = computed(() =>
  invoiceStore.allInvoices
    .filter(i => !i.is_settled)
    .reduce((sum, i) => sum + (Number(i.price) || 0), 0)
);

const settledAmountFormatted = computed(() =>
  settledAmount.value.toLocaleString('fa-IR') + ' تومان'
);

const remainingAmountFormatted = computed(() =>
  remainingAmount.value.toLocaleString('fa-IR') + ' تومان'
);

const currentMonthLabel = computed(() => {
  if (!currentFilter.value.persianMonth) return 'جاری';
  const monthName = PERSIAN_MONTHS[currentFilter.value.persianMonth - 1];
  return `${monthName} ${currentFilter.value.persianYear}`;
});

onMounted(async () => {
  await Promise.all([
    invoiceStore.fetchCustomers(),
    invoiceStore.fetchAllInvoices()
  ]);
});

async function handleMonthChange({ persianYear, persianMonth }) {
  currentFilter.value = { persianYear, persianMonth };
  await loadInvoicesForPersianMonth(persianYear, persianMonth);
}

async function loadInvoicesForPersianMonth(persianYear, persianMonth) {
  try {
    const { startDate, endDate } = getPersianMonthGregorianRange(persianYear, persianMonth);
    if (startDate && endDate) {
      await invoiceStore.searchInvoices({ start_date: startDate, end_date: endDate });
    } else {
      await invoiceStore.fetchInvoices();
    }
  } catch (err) {
    console.error('Failed to load invoices:', err);
    toast.error('خطا در بارگذاری فاکتورها');
  }
}

async function performSearch() {
  if (!searchDate.value) {
    if (currentFilter.value.persianYear) {
      await loadInvoicesForPersianMonth(currentFilter.value.persianYear, currentFilter.value.persianMonth);
    } else {
      await invoiceStore.fetchInvoices();
    }
    return;
  }
  const greg = toGregorianDate(searchDate.value);
  if (!greg) {
    toast.error('تاریخ انتخاب شده معتبر نیست');
    return;
  }
  try {
    await invoiceStore.searchInvoices({ start_date: greg, end_date: greg });
  } catch (err) {
    toast.error('خطا در جستجو');
  }
}

async function clearSearch() {
  searchDate.value = '';
  if (currentFilter.value.persianYear) {
    await loadInvoicesForPersianMonth(currentFilter.value.persianYear, currentFilter.value.persianMonth);
  } else {
    await invoiceStore.fetchInvoices();
  }
}

async function toggleUnsettledMain() {
  unsettledOnly.value = !unsettledOnly.value;
  if (unsettledOnly.value) {
    await invoiceStore.fetchAllInvoices();
    invoiceStore.currentInvoices = invoiceStore.allInvoices.filter(i => !i.is_settled);
  } else {
    if (currentFilter.value.persianYear) {
      await loadInvoicesForPersianMonth(currentFilter.value.persianYear, currentFilter.value.persianMonth);
    } else {
      await invoiceStore.fetchInvoices();
    }
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
  await invoiceStore.fetchAllInvoices();
  if (currentFilter.value.persianYear) {
    await loadInvoicesForPersianMonth(currentFilter.value.persianYear, currentFilter.value.persianMonth);
  } else {
    await invoiceStore.fetchInvoices();
  }
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
    await invoiceStore.fetchAllInvoices();
    if (currentFilter.value.persianYear) {
      await loadInvoicesForPersianMonth(currentFilter.value.persianYear, currentFilter.value.persianMonth);
    } else {
      await invoiceStore.fetchInvoices();
    }
  } else {
    toast.error(result.message);
  }
}

async function handleStatusChange() {
  await invoiceStore.fetchAllInvoices();
}

function navigateToCustomer(customerId) {
  router.push(`/customer/${customerId}`);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
