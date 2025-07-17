<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ t('locations.userAssignment.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('locations.userAssignment.description', { location: location?.name }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Search -->
        <div class="flex items-center gap-2">
          <Search class="w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="t('locations.userAssignment.searchPlaceholder')"
            class="flex-1"
          />
        </div>

        <!-- Users list -->
        <div class="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
          <div v-if="filteredUsers.length === 0" class="text-center py-8 text-muted-foreground">
            {{ t('locations.userAssignment.noUsersFound') }}
          </div>
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="flex items-center justify-between p-2 rounded hover:bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <Checkbox
                :id="`user-${user.id}`"
                :checked="selectedUserIds.includes(user.id)"
                @update:checked="toggleUser(user.id)"
              />
              <label
                :for="`user-${user.id}`"
                class="flex-1 cursor-pointer"
              >
                <p class="text-sm font-medium">{{ user.first_name }} {{ user.last_name }}</p>
                <p class="text-xs text-muted-foreground">{{ user.email }}</p>
              </label>
            </div>
            <Badge variant="outline" class="text-xs">
              {{ t(`roles.${user.role.toLowerCase()}`) }}
            </Badge>
          </div>
        </div>

        <!-- Selected count -->
        <p class="text-sm text-muted-foreground">
          {{ t('locations.userAssignment.selectedCount', { count: selectedUserIds.length }) }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="handleSave" :disabled="saving || selectedUserIds.length === 0">
          <span v-if="saving" class="flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {{ t('common.saving') }}
          </span>
          <span v-else>{{ t('locations.userAssignment.assignButton') }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import type { LocationResponseDto } from '~/types/locations'
import type { UserWithoutPassword } from '~/types/users'

interface Props {
  open: boolean
  location?: LocationResponseDto | null
  availableUsers: UserWithoutPassword[]
  assignedUserIds: string[]
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [userIds: string[]]
}>()

const { t } = useI18n()

// Local state
const searchQuery = ref('')
const selectedUserIds = ref<string[]>([])

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return props.availableUsers

  return props.availableUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    return fullName.includes(query) || user.email.toLowerCase().includes(query)
  })
})

// Watch for dialog open/close
watch(() => props.open, (newValue) => {
  if (newValue) {
    // Initialize with already assigned users
    selectedUserIds.value = [...props.assignedUserIds]
    searchQuery.value = ''
  }
})

// Methods
const toggleUser = (userId: string) => {
  const index = selectedUserIds.value.indexOf(userId)
  if (index > -1) {
    selectedUserIds.value.splice(index, 1)
  } else {
    selectedUserIds.value.push(userId)
  }
}

const handleCancel = () => {
  isOpen.value = false
}

const handleSave = () => {
  emit('save', selectedUserIds.value)
}
</script>