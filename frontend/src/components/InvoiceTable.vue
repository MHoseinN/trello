<template>
  <div class="table-container">
    <v-table hover>
      <thead>
        <tr>
          <th class="text-right">#</th>
          <th v-if="showCustomerColumn" class="text-right">نام مشتری</th>
          <th class="text-right">تاریخ</th>
          <th class="text-right">قیمت</th>
          <th class="text-center">وضعیت ارسال</th>
          <th class="text-center">وضعیت تسویه</th>
          <th v-if="showActions" class="text-center">عملیات</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!invoices || invoices.length === 0">
          <td :colspan="colCount" class="text-center py-12">
            <div class="d-flex flex-column align-center gap-2">
              <v-icon icon="mdi-file-document-outline" size="48" color="grey-lighten-1" />
              <span class="text-medium-emphasis">هیچ حسابی یافت نشد</span>
            </div>
          </td>
        </tr>
        <tr v-for="(invoice, index) in invoices" :key="invoice.id">
          <!-- Row number -->
          <td class="text-medium-emphasis">{{ index + 1 }}</td>

          <!-- Customer name (clickable) -->
          <td v-if="showCustomerColumn">
            <v-btn
              variant="text"
              color="primary"
              density="compact"
              @click="$emit('customer-click', invoice.customer_id)"
            >
              {{ invoice.customer_name }}
            </v-btn>
          </td>

          <!-- Date (Persian) -->
          <td dir="ltr" class="text-right">
            <span class="d-inline-block" style="min-width: 90px; text-align: right">{{ toPersianDate(invoice.date) }}</span>
          </td>

          <!-- Price -->
          <td class="font-weight-medium">{{ formatPrice(invoice.price) }}</td>

          <!-- Shipping status -->
          <td class="text-center">
            <v-chip
              :color="invoice.is_shipped ? 'success' : 'error'"
              variant="tonal"
              size="small"
              style="cursor: pointer; min-width: 90px"
              :disabled="!!loadingStatus[`${invoice.id}_is_shipped`]"
              @click="handleStatusChange(invoice, 'is_shipped')"
            >
              <v-progress-circular
                v-if="loadingStatus[`${invoice.id}_is_shipped`]"
                indeterminate
                size="12"
                width="2"
                class="me-1"
              />
              <span v-else>{{ invoice.is_shipped ? '✓ ارسال شده' : '✗ ارسال نشده' }}</span>
            </v-chip>
          </td>

          <!-- Settlement status -->
          <td class="text-center">
            <v-chip
              :color="invoice.is_settled ? 'success' : 'error'"
              variant="tonal"
              size="small"
              style="cursor: pointer; min-width: 90px"
              :disabled="!!loadingStatus[`${invoice.id}_is_settled`]"
              @click="handleStatusChange(invoice, 'is_settled')"
            >
              <v-progress-circular
                v-if="loadingStatus[`${invoice.id}_is_settled`]"
                indeterminate
                size="12"
                width="2"
                class="me-1"
              />
              <span v-else>{{ invoice.is_settled ? '✓ تسویه شده' : '✗ تسویه نشده' }}</span>
            </v-chip>
          </td>

          <!-- Actions -->
          <td v-if="showActions">
            <div class="d-flex align-center justify-center gap-2">
              <v-btn
                color="primary"
                variant="tonal"
                density="compact"
                size="small"
                prepend-icon="mdi-pencil"
                @click="$emit('edit', invoice)"
              >
                ویرایش
              </v-btn>
              <v-btn
                color="error"
                variant="tonal"
                density="compact"
                size="small"
                prepend-icon="mdi-delete"
                @click="$emit('delete', invoice.id)"
              >
                حذف
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useToast } from 'vue-toastification';
import { useInvoiceStore } from '../stores/invoiceStore';
import { toPersianDate, formatPrice } from '../utils/dateConverter';

const props = defineProps({
  invoices: { type: Array, default: () => [] },
  showCustomerColumn: { type: Boolean, default: true },
  showActions: { type: Boolean, default: true }
});

const emit = defineEmits(['edit', 'delete', 'status-change', 'customer-click']);

const toast = useToast();
const invoiceStore = useInvoiceStore();

const loadingStatus = reactive({});

const colCount = computed(() => {
  let count = 5;
  if (props.showCustomerColumn) count++;
  if (props.showActions) count++;
  return count;
});

async function handleStatusChange(invoice, field) {
  const key = `${invoice.id}_${field}`;
  if (loadingStatus[key]) return;

  loadingStatus[key] = true;
  const newValue = !invoice[field];

  const result = await invoiceStore.updateStatus(invoice.id, field, newValue);
  loadingStatus[key] = false;

  if (result.success) {
    emit('status-change', { id: invoice.id, field, value: newValue });
    const label = field === 'is_shipped' ? 'وضعیت ارسال' : 'وضعیت تسویه';
    toast.success(`${label} تغییر کرد`);
  } else {
    toast.error(result.message);
  }
}
</script>
