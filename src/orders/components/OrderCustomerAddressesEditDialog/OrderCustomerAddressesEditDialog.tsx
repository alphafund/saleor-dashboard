import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Typography
} from "@material-ui/core";
import Checkbox from "@saleor/components/Checkbox";
import ConfirmButton from "@saleor/components/ConfirmButton";
import FormSpacer from "@saleor/components/FormSpacer";
import { ShopInfo_shop_countries } from "@saleor/components/Shop/types/ShopInfo";
import {
  CustomerAddresses_user_addresses,
  CustomerAddresses_user_defaultBillingAddress,
  CustomerAddresses_user_defaultShippingAddress
} from "@saleor/customers/types/CustomerAddresses";
import { OrderErrorFragment } from "@saleor/fragments/types/OrderErrorFragment";
import useAddressValidation from "@saleor/hooks/useAddressValidation";
import { FormChange, SubmitPromise } from "@saleor/hooks/useForm";
import useModalDialogErrors from "@saleor/hooks/useModalDialogErrors";
import { buttonMessages } from "@saleor/intl";
import { ConfirmButtonTransitionState } from "@saleor/macaw-ui";
import { transformAddressToAddressInput } from "@saleor/misc";
import { AddressInput, AddressTypeEnum } from "@saleor/types/globalTypes";
import { mapCountriesToChoices } from "@saleor/utils/maps";
import classNames from "classnames";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { getById } from "../OrderReturnPage/utils";
import OrderCustomerAddressesEditForm, {
  AddressInputOptionEnum,
  OrderCustomerAddressesEditData,
  OrderCustomerAddressesEditFormData,
  OrderCustomerAddressesEditHandlers
} from "./form";
import { dialogMessages } from "./messages";
import OrderCustomerAddressEdit from "./OrderCustomerAddressEdit";
import OrderCustomerAddressesSearch from "./OrderCustomerAddressesSearch";
import { useStyles } from "./styles";
import { validateDefaultAddress } from "./utils";

export interface OrderCustomerSearchAddressState {
  open: boolean;
  type: AddressTypeEnum;
}
export interface OrderCustomerAddressesEditDialogOutput {
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
}

export enum AddressEditDialogVariant {
  CHANGE_CUSTOMER,
  CHANGE_SHIPPING_ADDRESS,
  CHANGE_BILLING_ADDRESS
}

export interface OrderCustomerAddressesEditDialogProps {
  open: boolean;
  variant: AddressEditDialogVariant;
  loading: boolean;
  confirmButtonState: ConfirmButtonTransitionState;
  errors: OrderErrorFragment[];
  countries?: ShopInfo_shop_countries[];
  customerAddresses?: CustomerAddresses_user_addresses[];
  defaultShippingAddress?: CustomerAddresses_user_defaultShippingAddress;
  defaultBillingAddress?: CustomerAddresses_user_defaultBillingAddress;
  onClose();
  onConfirm(
    data: Partial<OrderCustomerAddressesEditDialogOutput>
  ): SubmitPromise;
}

const defaultSearchState: OrderCustomerSearchAddressState = {
  open: false,
  type: undefined
};

const OrderCustomerAddressesEditDialog: React.FC<OrderCustomerAddressesEditDialogProps> = props => {
  const {
    open,
    variant,
    loading,
    confirmButtonState,
    errors = [],
    countries = [],
    customerAddresses = [],
    defaultShippingAddress,
    defaultBillingAddress,
    onClose,
    onConfirm
  } = props;

  const classes = useStyles(props);
  const intl = useIntl();

  const hasCustomerChanged =
    variant === AddressEditDialogVariant.CHANGE_CUSTOMER;

  const {
    errors: shippingValidationErrors,
    submit: handleShippingSubmit
  } = useAddressValidation(address => address, AddressTypeEnum.SHIPPING);
  const {
    errors: billingValidationErrors,
    submit: handleBillingSubmit
  } = useAddressValidation(address => address, AddressTypeEnum.BILLING);
  const dialogErrors = useModalDialogErrors(
    [...errors, ...shippingValidationErrors, ...billingValidationErrors],
    open
  );

  const continueToSearchAddressesState = (
    data: OrderCustomerAddressesEditFormData
  ): boolean =>
    !hasCustomerChanged &&
    !addressSearchState.open &&
    (variant === AddressEditDialogVariant.CHANGE_SHIPPING_ADDRESS
      ? data.shippingAddressInputOption
      : data.billingAddressInputOption) ===
      AddressInputOptionEnum.CUSTOMER_ADDRESS;

  const getCustomerAddress = (
    selectedCustomerAddressID: string
  ): AddressInput =>
    transformAddressToAddressInput(
      customerAddresses.find(getById(selectedCustomerAddressID))
    );

  const handleAddressesSubmit = (
    data: OrderCustomerAddressesEditFormData
  ): Partial<OrderCustomerAddressesEditDialogOutput> => {
    const shippingAddress =
      customerAddresses.length > 0 &&
      data.shippingAddressInputOption ===
        AddressInputOptionEnum.CUSTOMER_ADDRESS
        ? getCustomerAddress(data.customerShippingAddress.id)
        : handleShippingSubmit(data.shippingAddress);

    // eslint-disable-next-line no-console
    console.log(shippingAddress);

    const billingAddress =
      customerAddresses.length > 0 &&
      data.billingAddressInputOption === AddressInputOptionEnum.CUSTOMER_ADDRESS
        ? getCustomerAddress(data.customerBillingAddress.id)
        : handleBillingSubmit(data.billingAddress);

    if (variant === AddressEditDialogVariant.CHANGE_SHIPPING_ADDRESS) {
      return {
        shippingAddress,
        ...(data.billingSameAsShipping && { billingAddress: shippingAddress })
      };
    }
    if (variant === AddressEditDialogVariant.CHANGE_BILLING_ADDRESS) {
      return {
        ...(data.billingSameAsShipping && { shippingAddress: billingAddress }),
        billingAddress
      };
    }
    return {
      shippingAddress,
      billingAddress: data.billingSameAsShipping
        ? shippingAddress
        : billingAddress
    };
  };

  const getDialogTitle = () => {
    if (variant === AddressEditDialogVariant.CHANGE_SHIPPING_ADDRESS) {
      return <FormattedMessage {...dialogMessages.shippingChangeTitle} />;
    }
    if (variant === AddressEditDialogVariant.CHANGE_BILLING_ADDRESS) {
      return <FormattedMessage {...dialogMessages.billingChangeTitle} />;
    }
    return <FormattedMessage {...dialogMessages.customerChangeTitle} />;
  };
  const getDialogDescription = () => {
    if (customerAddresses.length === 0) {
      return <FormattedMessage {...dialogMessages.noAddressDescription} />;
    }
    if (variant === AddressEditDialogVariant.CHANGE_CUSTOMER) {
      return <FormattedMessage {...dialogMessages.customerChangeDescription} />;
    }
    return <FormattedMessage {...dialogMessages.addressChangeDescription} />;
  };

  const handleSubmit = async (data: OrderCustomerAddressesEditFormData) => {
    // eslint-disable-next-line no-console
    console.log(data);
    if (continueToSearchAddressesState(data)) {
      setAddressSearchState({
        open: true,
        type:
          variant === AddressEditDialogVariant.CHANGE_SHIPPING_ADDRESS
            ? AddressTypeEnum.SHIPPING
            : AddressTypeEnum.BILLING
      });
      return;
    }

    const addressesInput = handleAddressesSubmit(data);
    // eslint-disable-next-line no-console
    console.log(addressesInput);
    if (addressesInput) {
      onConfirm(addressesInput).then(() =>
        setAddressSearchState(defaultSearchState)
      );
    }
  };

  const countryChoices = mapCountriesToChoices(countries);

  const [addressSearchState, setAddressSearchState] = React.useState<
    OrderCustomerSearchAddressState
  >(defaultSearchState);

  const validatedDefaultShippingAddress = validateDefaultAddress(
    defaultShippingAddress,
    customerAddresses
  );
  const validatedDefaultBillingAddress = validateDefaultAddress(
    defaultBillingAddress,
    customerAddresses
  );

  const addressEditCommonProps = {
    hideCard: !hasCustomerChanged,
    loading,
    countryChoices,
    customerAddresses
  };
  const shippingAddressEditProps = (
    data: OrderCustomerAddressesEditData,
    handlers: OrderCustomerAddressesEditHandlers,
    change: FormChange
  ) => ({
    ...addressEditCommonProps,
    addressInputName: "shippingAddressInputOption",
    formErrors: dialogErrors.filter(
      error => error.addressType === AddressTypeEnum.SHIPPING
    ),
    onEdit: () =>
      setAddressSearchState({
        open: true,
        type: AddressTypeEnum.SHIPPING
      }),
    onChangeAddressInputOption: change,
    addressInputOption: data.shippingAddressInputOption,
    selectedCustomerAddressId: data.customerShippingAddress?.id,
    formAddress: data.shippingAddress,
    formAddressCountryDisplayName: data.shippingCountryDisplayName,
    onChangeFormAddress: event =>
      handlers.changeFormAddress(event, "shippingAddress"),
    onChangeFormAddressCountry: handlers.selectShippingCountry
  });
  const billingAddressEditProps = (
    data: OrderCustomerAddressesEditData,
    handlers: OrderCustomerAddressesEditHandlers,
    change: FormChange
  ) => ({
    ...addressEditCommonProps,
    addressInputName: "billingAddressInputOption",
    formErrors: dialogErrors.filter(
      error => error.addressType === AddressTypeEnum.BILLING
    ),
    onEdit: () =>
      setAddressSearchState({
        open: true,
        type: AddressTypeEnum.BILLING
      }),
    onChangeAddressInputOption: change,
    addressInputOption: data.billingAddressInputOption,
    selectedCustomerAddressId: data.customerBillingAddress?.id,
    formAddress: data.billingAddress,
    formAddressCountryDisplayName: data.billingCountryDisplayName,
    onChangeFormAddress: event =>
      handlers.changeFormAddress(event, "billingAddress"),
    onChangeFormAddressCountry: handlers.selectBillingCountry
  });

  return (
    <Dialog
      onClose={() => {
        setAddressSearchState(defaultSearchState);
        onClose();
      }}
      open={open}
      fullWidth
    >
      <OrderCustomerAddressesEditForm
        countryChoices={countryChoices}
        defaultShippingAddress={validatedDefaultShippingAddress}
        defaultBillingAddress={validatedDefaultBillingAddress}
        defaultBillingSameAsShipping={hasCustomerChanged}
        onSubmit={handleSubmit}
      >
        {({ change, data, handlers }) => (
          <>
            {addressSearchState.open ? (
              <OrderCustomerAddressesSearch
                openFromCustomerChange={hasCustomerChanged}
                type={addressSearchState?.type}
                billingSameAsShipping={data.billingSameAsShipping}
                formChange={change}
                transitionState={confirmButtonState}
                customerAddresses={customerAddresses}
                selectedCustomerAddressId={
                  addressSearchState.type === AddressTypeEnum.SHIPPING
                    ? data.customerShippingAddress?.id
                    : data.customerBillingAddress?.id
                }
                onChangeCustomerShippingAddress={customerAddress =>
                  handlers.changeCustomerAddress(
                    customerAddress,
                    "customerShippingAddress"
                  )
                }
                onChangeCustomerBillingAddress={customerAddress =>
                  handlers.changeCustomerAddress(
                    customerAddress,
                    "customerBillingAddress"
                  )
                }
                exitSearch={() => setAddressSearchState(defaultSearchState)}
              />
            ) : (
              <>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogContent
                  className={classNames(classes.dialogContent, {
                    [classes.overflowVisible]: !hasCustomerChanged
                  })}
                >
                  <Typography>{getDialogDescription()}</Typography>
                  <FormSpacer />
                  {hasCustomerChanged && (
                    <>
                      <OrderCustomerAddressEdit
                        {...shippingAddressEditProps(data, handlers, change)}
                      />
                      <FormSpacer />
                      <Divider />
                      <FormSpacer />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={data.billingSameAsShipping}
                            name="billingSameAsShipping"
                            onChange={() =>
                              change({
                                target: {
                                  name: "billingSameAsShipping",
                                  value: !data.billingSameAsShipping
                                }
                              })
                            }
                            data-test="billingSameAsShipping"
                          />
                        }
                        label={intl.formatMessage(
                          dialogMessages.billingSameAsShipping
                        )}
                      />
                      {!data.billingSameAsShipping && (
                        <>
                          <FormSpacer />
                          <Typography>
                            {customerAddresses.length > 0 ? (
                              <FormattedMessage
                                {...dialogMessages.customerChangeBillingDescription}
                              />
                            ) : (
                              <FormattedMessage
                                {...dialogMessages.noAddressBillingDescription}
                              />
                            )}
                          </Typography>
                          <FormSpacer />
                          <OrderCustomerAddressEdit
                            {...billingAddressEditProps(data, handlers, change)}
                          />
                        </>
                      )}
                    </>
                  )}
                  {variant ===
                    AddressEditDialogVariant.CHANGE_SHIPPING_ADDRESS && (
                    <OrderCustomerAddressEdit
                      {...shippingAddressEditProps(data, handlers, change)}
                    />
                  )}
                  {variant ===
                    AddressEditDialogVariant.CHANGE_BILLING_ADDRESS && (
                    <OrderCustomerAddressEdit
                      {...billingAddressEditProps(data, handlers, change)}
                    />
                  )}
                </DialogContent>
                <DialogActions>
                  <ConfirmButton
                    transitionState={confirmButtonState}
                    variant="primary"
                    type="submit"
                    data-test="submit"
                  >
                    <FormattedMessage
                      {...(continueToSearchAddressesState(data)
                        ? buttonMessages.continue
                        : buttonMessages.save)}
                    />
                  </ConfirmButton>
                </DialogActions>
              </>
            )}
          </>
        )}
      </OrderCustomerAddressesEditForm>
    </Dialog>
  );
};

OrderCustomerAddressesEditDialog.displayName =
  "OrderCustomerAddressesEditDialog";
export default OrderCustomerAddressesEditDialog;
