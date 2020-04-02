///<reference path='../..//Typings/tsd.d.ts' />
///<reference path='./BaseSingleCheckoutController.ts' />

module Orckestra.Composer {
    'use strict';

    export class ShippingAddressSingleCheckoutController extends Orckestra.Composer.BaseSingleCheckoutController {

        public initialize() {
            super.initialize();
            var self: ShippingAddressSingleCheckoutController = this;
            self.viewModelName = 'ShippingAddress';

            let vueShippingAddressMixin = {
                data: {
                    ComplementaryAddressAddState: false,
                    PostalCodeError: false
                },
                created() {
                    this.adressBeforeEdit = { ...this.Cart.ShippingAddress };
                },
                mounted() {

                },
                computed: {
                },
                methods: {
                    processShippingAddress() {
                        var processShippingAddress: Q.Deferred<boolean> = Q.defer<boolean>();
                        this.ShippingEnteredOnce = true;
                        let formId = '#addressForm';
                        let isValid = this.initializeParsey(formId);
                        if (isValid) {
                            if (this.addressModified()) {
                                let postalCode = this.Cart.ShippingAddress.PostalCode;
                                this.changePostalCode(postalCode).then(success => {
                                    if (success) {
                                        //WHEN CHANGING SHIPPING, WE ALSO NEED UPDATE BILLING
                                        let controlersToUpdate = [self.viewModelName, 'BillingAddress'];
                                        this.prepareBillingAddress()
                                            .then(() => self.checkoutService.updateCart(controlersToUpdate))
                                            .then(result => {
                                                let { Cart } = result;
                                                this.Cart.Payment.BillingAddress = Cart.Payment.BillingAddress;
                                                self.eventHub.publish("cartBillingAddressUpdated", {data: this});
                                                processShippingAddress.resolve(true);
                                            })
                                            .fail(reason => {
                                                console.log(reason);
                                                processShippingAddress.resolve(false);
                                            });
                                    } else {
                                        processShippingAddress.resolve(false);
                                    }
                                })

                            } else {
                                processShippingAddress.resolve(true);
                            }
                        } else {
                            processShippingAddress.resolve(false);
                        }

                        return processShippingAddress.promise;
                    },
                    recalculateShippingFee() {

                        let formId = !this.IsAuthenticated ? '#addressForm' : '#addNewAddressForm';
                        let isValid = this.initializeParsey(formId);
                        if (isValid) {
                            this.changePostalCode(this.Cart.ShippingAddress.PostalCode);
                        }

                    },
                    changePostalCode(postalCode: any) {
                        var processPostalCode: Q.Deferred<boolean> = Q.defer<boolean>();

                        this.PostalCodeError = false;
                        if (this.adressBeforeEdit.PostalCode != postalCode) {
                            this.IsLoading = true;
                            self.checkoutService.updatePostalCode(postalCode).then((cart: any) => {
                                this.adressBeforeEdit = { ...this.Cart.ShippingAddress };
                                this.Cart = {
                                    ...this.Cart,
                                    ShippingAddress: {
                                        ...this.Cart.ShippingAddress,
                                        PostalCode: cart.ShippingAddress.PostalCode,
                                        RegionCode: cart.ShippingAddress.RegionCode,
                                        RegionName: cart.ShippingAddress.RegionName
                                    },
                                    OrderSummary: cart.OrderSummary
                                };
                                processPostalCode.resolve(true);
                            })
                                .fail(reason => {
                                    console.log(reason);
                                    this.PostalCodeError = true;
                                    processPostalCode.resolve(false);
                                })
                                .finally(() => this.IsLoading = false);
                        } else {
                            processPostalCode.resolve(true);
                        }
                        return processPostalCode.promise;
                    },

                    addressModified() {
                        var keys = _.keys(this.Cart.ShippingAddress);
                        var isModified = _.some(keys, (key) => this.adressBeforeEdit[key] != this.Cart.ShippingAddress[key]);
                        return isModified;
                    },
                    adjustPostalCode() {
                        this.Cart.ShippingAddress.PostalCode = this.Cart.ShippingAddress.PostalCode.toUpperCase();
                        if(this.BillingAddress && this.BillingAddress.PostalCode) {
                            this.BillingAddress.PostalCode = this.BillingAddress.PostalCode.toUpperCase();
                        }
                    }
                }
            };

            this.checkoutService.VueCheckoutMixins.push(vueShippingAddressMixin);
        }

        public getViewModelNameForUpdatePromise(): Q.Promise<any> {
            return Q.fcall(() => {
                var vueData = this.checkoutService.VueCheckout;
                if (vueData.addressModified()) {
                    return this.viewModelName;
                };
            });
        }

        public getUpdateModelPromise(): Q.Promise<any> {
            return Q.fcall(() => {
                let vm = {};
                let vueAddressData = this.checkoutService.VueCheckout.Cart.ShippingAddress;
                vm[this.viewModelName] = JSON.stringify(vueAddressData);
                return vm;
            });
        }

    }
}
