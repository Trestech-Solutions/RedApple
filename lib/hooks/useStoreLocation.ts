import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import {
  setStoreLocation,
  setBranchDetails,
  setAreaFromBranch,
  clearStoreLocation,
  type StoreLocationState,
} from '@/redux/slices/storeLocationSlice'

export function useStoreLocation() {
  const dispatch = useAppDispatch()
  const storeLocation = useAppSelector((s) => s.storeLocation)

  return {
    branchId:           storeLocation.branchId,
    branchName:         storeLocation.branchName,
    branchLocation:     storeLocation.branchLocation,
    branchAddress:      storeLocation.branchAddress,
    branchMapLocation:  storeLocation.branchMapLocation,
    branchPhone:        storeLocation.branchPhone,
    cityId:             storeLocation.cityId,
    cityName:           storeLocation.cityName,
    areaId:             storeLocation.areaId,
    areaName:           storeLocation.areaName,
    displayLabel:       storeLocation.displayLabel,

    setStoreLocation: (payload: Partial<StoreLocationState>) =>
      dispatch(setStoreLocation(payload)),

    setBranchDetails: (payload: {
      branchLocation: string
      branchAddress: string
      branchMapLocation: string
      branchPhone?: string
    }) =>
      dispatch(setBranchDetails(payload)),

    setAreaFromBranch: (areaId: number, areaName: string) =>
      dispatch(setAreaFromBranch({ areaId, areaName })),

    clearStoreLocation: () => dispatch(clearStoreLocation()),
  }
}
