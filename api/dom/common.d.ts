import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as BikeComponents from 'bike/components'

declare global {
  interface Window {
    React: typeof React
    ReactDOM: typeof ReactDOM
    ReactDOMClient: typeof ReactDOMClient
    ReactJSXRuntime: typeof ReactJSXRuntime
    BikeComponents: typeof BikeComponents
    bike: typeof bike
  }
}
