import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as BikeComponents from 'bike/components'

interface SFSymbolOptions {
  weight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  scale?: 'small' | 'medium' | 'large'
}

declare global {
  interface Window {
    React: typeof React
    ReactDOM: typeof ReactDOM
    ReactDOMClient: typeof ReactDOMClient
    ReactJSXRuntime: typeof ReactJSXRuntime
    BikeComponents: typeof BikeComponents
    symbolURL(name: string, options?: SFSymbolOptions): string
  }
  /** Returns a URL string for the named SF Symbol. */
  function symbolURL(name: string, options?: SFSymbolOptions): string
}
