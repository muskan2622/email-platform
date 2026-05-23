"use client"

import { useMemo } from "react"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import type { FieldDefinition } from "@/lib/automation/field-definitions"
import {
  findTriggerInCatalog,
  getFieldDefinitionFromCatalog,
  resolveConditionFields,
  resolveEventTypes,
  resolveTriggerCategories,
} from "@/lib/automation/resolve-catalog"
import type { TriggerCategory, TriggerDefinition } from "@/lib/automation/trigger-catalog"

export function useAutomationCatalog() {
  const { data, loading } = usePlatformDataContext()

  const categories = useMemo(
    () => resolveTriggerCategories(data?.eventTypeCategories ?? []),
    [data?.eventTypeCategories]
  )

  const eventTypes = useMemo(
    () => resolveEventTypes(data?.eventTypes ?? []),
    [data?.eventTypes]
  )

  const conditionFields = useMemo(
    () => resolveConditionFields(data?.conditionFields ?? []),
    [data?.conditionFields]
  )

  return {
    loading,
    categories,
    eventTypes,
    conditionFields,
    findTrigger: (event: string) => findTriggerInCatalog(event, eventTypes),
    getFieldDefinition: (field: string) =>
      getFieldDefinitionFromCatalog(field, conditionFields),
  }
}

export type AutomationCatalog = {
  categories: Record<TriggerCategory, string>
  eventTypes: TriggerDefinition[]
  conditionFields: FieldDefinition[]
}
