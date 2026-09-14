import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface StoreLocationState {
  // Branch
  branchId: number | null
  branchName: string
  branchLocation: string
  branchAddress: string
  branchMapLocation: string
  branchPhone: string

  // City (delivery: from city selection)
  cityId: number | null
  cityName: string

  // Area (delivery: from city/area selection; pickup: first area of the branch)
  areaId: number | null
  areaName: string

  // Human-readable display label shown in the navbar
  displayLabel: string
}

const initialState: StoreLocationState = {
  branchId:           null,
  branchName:         '',
  branchLocation:     '',
  branchAddress:      '',
  branchMapLocation:  '',
  branchPhone:        '',
  cityId:             null,
  cityName:           '',
  areaId:             null,
  areaName:           '',
  displayLabel:       '',
}

const storeLocationSlice = createSlice({
  name: 'storeLocation',
  initialState,
  reducers: {
    setStoreLocation(state, action: PayloadAction<Partial<StoreLocationState>>) {
      const { branchId, branchName, branchLocation, branchAddress, branchMapLocation, branchPhone, cityId, cityName, areaId, areaName, displayLabel } = action.payload
      if (branchId           !== undefined) state.branchId           = branchId
      if (branchName         !== undefined) state.branchName         = branchName
      if (branchLocation     !== undefined) state.branchLocation     = branchLocation
      if (branchAddress      !== undefined) state.branchAddress      = branchAddress
      if (branchMapLocation  !== undefined) state.branchMapLocation  = branchMapLocation
      if (branchPhone        !== undefined) state.branchPhone        = branchPhone
      if (cityId             !== undefined) state.cityId             = cityId
      if (cityName           !== undefined) state.cityName           = cityName
      if (areaId             !== undefined) state.areaId             = areaId
      if (areaName           !== undefined) state.areaName           = areaName
      if (displayLabel       !== undefined) state.displayLabel       = displayLabel
    },

    setBranchDetails(
      state,
      action: PayloadAction<{
        branchLocation: string
        branchAddress: string
        branchMapLocation: string
        branchPhone?: string
      }>
    ) {
      state.branchLocation    = action.payload.branchLocation
      state.branchAddress     = action.payload.branchAddress
      state.branchMapLocation = action.payload.branchMapLocation
      if (action.payload.branchPhone !== undefined) {
        state.branchPhone = action.payload.branchPhone
      }
    },

    setAreaFromBranch(
      state,
      action: PayloadAction<{ areaId: number; areaName: string }>
    ) {
      state.areaId   = action.payload.areaId
      state.areaName = action.payload.areaName
    },

    clearStoreLocation() {
      return initialState
    },
  },
})

export const { setStoreLocation, setBranchDetails, setAreaFromBranch, clearStoreLocation } =
  storeLocationSlice.actions
export default storeLocationSlice.reducer
