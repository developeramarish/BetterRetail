///<reference path='../../../../Composer.UI/Source/Typings/tsd.d.ts' />
///<reference path='../../../../Composer.UI/Source/TypeScript/Mvc/Controller.ts' />
///<reference path='../../../../Composer.UI/Source/TypeScript/Mvc/IControllerActionContext.ts' />
///<reference path='./RecurringScheduleController.ts' />
///<reference path='../../../../Composer.Cart.UI/RecurringOrder/source/TypeScript/Services/RecurringOrderService.ts' />
///<reference path='../../../../Composer.Cart.UI/RecurringOrder/source/TypeScript/Services/IRecurringOrderService.ts' />
///<reference path='../../../../Composer.Cart.UI/RecurringOrder/source/TypeScript/Repositories/RecurringOrderRepository.ts' />
///<reference path='../../../../Composer.UI/Source/Typescript/UI/UIModal.ts' />

module Orckestra.Composer {

    export class MyRecurringScheduleController extends Orckestra.Composer.RecurringScheduleController {
        private recurringOrderService: IRecurringOrderService = new RecurringOrderService(new RecurringOrderRepository(), this.eventHub);

        private debounceUpdateLineItem: (args: any) => void;
        private updateWaitTime = 300;
        private busyHandler: UIBusyHandle;
        private viewModelName = '';
        private uiModalConfirmRemove: UIModal;
        protected modalElementSelectorRemove: string = '#recurringOrderTemplateRemoveConfirmationModal';

        public initialize() {

            super.initialize();

            this.viewModelName = 'MyRecurringSchedule';
            this.uiModalConfirmRemove = new UIModal(window, this.modalElementSelectorRemove, this.deleteLineItem, this);
        }

        public updateLineItemQuantity(actionContext: Orckestra.Composer.IControllerActionContext): void {

            if (!this.debounceUpdateLineItem) {
                this.debounceUpdateLineItem =
                    _.debounce((args) =>
                        this.applyUpdateLineItemQuantity(args), this.updateWaitTime);
            }

            let context: JQuery = actionContext.elementContext;
            let cartQuantityElement = actionContext.elementContext
                .parents('.cart-item')
                .find('.cart-quantity-template');

            let incrementButtonElement = actionContext.elementContext
                .parents('.cart-item')
                .find('.increment-quantity');

            let decrementButtonElement = actionContext.elementContext
                .parents('.cart-item')
                .find('.decrement-quantity');

            const action: string = <any>context.data('action');
            const currentQuantity: number = parseInt(cartQuantityElement.text(), 10);

            const updatedQuantity = this.updateQuantity(action, currentQuantity);
            var quantity: number = parseInt(<any>context.data('quantity'), 10);

            updatedQuantity === 1 ? decrementButtonElement.attr('disabled', 'disabled') : decrementButtonElement.removeAttr('disabled');
            //updatedQuantity === 99 ? incrementButtonElement.attr('disabled', 'disabled') : incrementButtonElement.removeAttr('disabled');

            cartQuantityElement.text(updatedQuantity);

            var args: any = {
                actionContext: actionContext,
                context: context,
                cartQuantityElement: cartQuantityElement
            };

            if (quantity !== updatedQuantity) {
                //use only debounced function when incrementing/decrementing quantity
                this.debounceUpdateLineItem(args);
            }
        }

        private applyUpdateLineItemQuantity(args: any) {

            var context: JQuery = args.actionContext.elementContext;
            this.busyHandler = this.asyncBusy({ elementContext: args.actionContext.elementContext });
            let actionElementSpan = args.context.find('span.fa').not('.loading-indicator');

            const updateLineItemQuantityParam: IRecurringOrderTemplateUpdateLineItemQuantityParam = {
                lineItemId: args.cartQuantityElement.data('lineitemid'),
                quantity: Number(args.cartQuantityElement.text())
            };
            args.cartQuantityElement.parents('.cart-item').addClass('is-loading');
            actionElementSpan.hide();

            this.recurringOrderService.updateTemplateLineItemQuantity(updateLineItemQuantityParam)
                .then(result => {
                    args.cartQuantityElement.parents('.cart-item').removeClass('is-loading');
                    actionElementSpan.show();

                    //render only section?
                    this.reRenderPage(result);
                })
                .fail((reason: any) => this.onLineItemQuantityFailed(context, reason))
                .fin(() => this.releaseBusyHandler());
        }

        protected onLineItemQuantityFailed(context: JQuery, reason: any): void {
            console.error('Error while updating line item quantity.', reason);
            ErrorHandler.instance().outputErrorFromCode('LineItemQuantityFailed');
        }

        public updateQuantity(action: string, quantity: number): number {
            if (!action) {
                return quantity;
            }

            switch (action.toUpperCase()) {
                case 'INCREMENT':
                    quantity++;
                    break;

                case 'DECREMENT':
                    quantity--;
                    if (quantity < 1) {
                        quantity = 1;
                    }
                    break;
            }

            return quantity;
        }

        protected releaseBusyHandler(): void {
            if (this.busyHandler) {
                this.busyHandler.done();
                this.busyHandler = null;
            }
        }

        public reRenderPage(vm) {
            //this.viewModel = vm;
            this.render(this.viewModelName, vm);
        }

        public deleteLineItemConfirm(actionContext: IControllerActionContext) {
            this.uiModalConfirmRemove.openModal(actionContext.event);
        }

        public deleteLineItem(event: JQueryEventObject): Q.Promise<void> {

            let element = $(event.target);
            var $listItem = element.closest('[data-lineitemid]');
            var lineItemId = $listItem.data('lineitemid');

            const deleteLineItemsParam: IRecurringOrderTemplateLineItemDeleteParam = {
                lineItemId: lineItemId
            };

            this.busyHandler = this.asyncBusy({elementContext: element, containerContext: $listItem });

            return this.recurringOrderService.deleteTemplateLineItem(deleteLineItemsParam)
                .then(result => {
                    $('#recurringOrderTemplatesRemoveConfirm').modal('hide');
                    this.reRenderPage(result);
                }).fin(() => this.releaseBusyHandler());
        }
    }
}
