<template>
  <span v-if="label" class="airing-chip" :class="`status-${status}`">
    {{ label }}
  </span>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue';
import type { AiringStatus } from '../../../_provider/listAbstract';

const props = defineProps({
  status: {
    type: String as PropType<AiringStatus>,
    required: false,
    default: undefined,
  },
});

const labels: Record<AiringStatus, string> = {
  airing: 'Airing',
  aired: 'Aired',
  not_yet_aired: 'Not aired',
};

const label = computed(() => (props.status ? labels[props.status] : ''));
</script>

<style lang="less" scoped>
@import '../../less/_globals.less';

.airing-chip {
  .border-pill();
  .block-select();

  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 3px 8px;
  color: white;
  background-color: var(--cl-dark-background);
  font-size: 0.78em;
  font-weight: 600;
  line-height: 1.1;
  white-space: nowrap;
}

.status-airing {
  background-color: var(--cl-state-1);
}

.status-aired {
  background-color: var(--cl-dark-background);
}

.status-not_yet_aired {
  background-color: var(--cl-state-3);
}
</style>
