"use client"

import { createContext } from "react"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContextProps {
  config: ChartConfig
}

export const ChartContext = createContext<ChartContextProps>({
  config: {},
})