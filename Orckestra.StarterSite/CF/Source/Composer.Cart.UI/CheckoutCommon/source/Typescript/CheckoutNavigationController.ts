///<reference path='../../../../Composer.UI/Source/Typings/tsd.d.ts' />
///<reference path='../../../CheckoutCommon/source/Typescript/BaseCheckoutController.ts' />

module Orckestra.Composer {
    'use strict';

    export class CheckoutNavigationController extends Orckestra.Composer.Controller {

        protected currentStep: any = null;
        protected viewModelName: string;
        protected checkoutService: ICheckoutService;

        public initialize() {

            this.viewModelName = 'checkoutNavigation';

            super.initialize();

            this.checkoutService = CheckoutService.getInstance();

            this.currentStep = _.find(this.context.viewModel.Steps, { IsActive: true });

            this.renderData();
        }

        public renderData(): Q.Promise<void> {

            return Q.fcall(() => {
                this.eventHub.publish('checkoutStepRendered',
                    {
                        data: {
                            StepNumber: this.currentStep.StepNumber,
                            Cart: this.checkoutService.getCart()
                        }
                    });
            });
        }
    }
}
