import * as angular from 'angular';
import * as _ from "underscore";
import { moduleName } from "../module-name";
import { Transition } from '@uirouter/core';


export class RegisterTemplateController {

    /**
    * Reference to the RegisteredTemplate Kylo id passed when editing a template
    * @type {null|*}
    */
    registeredTemplateId: any;
    /**
    * Reference to the NifiTemplate Id. Used if kylo id above is not present
    * @type {null|*}
    */
    nifiTemplateId: any;
    /**
    * The model being edited/created
    */
    model: any;
    allowAccessControl: boolean = false;
    allowAdmin: boolean = false;
    allowEdit: boolean = false;
    /**
    * The Stepper Controller set after initialized
    * @type {null}
    */
    stepperController: any = null;
    loading: boolean = true;
    stepperUrl: any;
    $transition$: Transition;

    static readonly $inject = ["$scope", "$http", "$mdToast", "$q", "RegisterTemplateService", "StateService", "AccessControlService", "BroadcastService"];

    constructor(private $scope: IScope, private $http: angular.IHttpService, private $mdToast: angular.material.IToastService, private $q: angular.IQService
        , private RegisterTemplateService: any, private StateService: any, private AccessControlService: any, private BroadcastService: any) {
        
        this.registeredTemplateId = this.$transition$.params().registeredTemplateId || null;

        this.nifiTemplateId = this.$transition$.params().nifiTemplateId || null;

        this.model = this.RegisterTemplateService.model;

    }
    $onInit(){
        this.ngOnInit();
    }

    ngOnInit(){
            //Wait for the properties to come back before allowing the user to go to the next step
            this.RegisterTemplateService.loadTemplateWithProperties(this.registeredTemplateId, this.nifiTemplateId).then((response: any) => {
            this.loading = false;
            this.RegisterTemplateService.warnInvalidProcessorNames();
            this.$q.when(this.RegisterTemplateService.checkTemplateAccess()).then((response: any) => {
                if (!response.isValid) {
                    //PREVENT access
                }
                this.allowAccessControl = response.allowAccessControl;
                this.allowAdmin = response.allowAdmin;
                this.allowEdit = response.allowEdit;
                this.updateAccessControl();
                this.BroadcastService.notify("REGISTERED_TEMPLATE_LOADED", "LOADED");

            });
        }, (err: any) => {
            this.loading = false;
            this.RegisterTemplateService.resetModel();
            this.allowAccessControl = false;
            this.allowAdmin = false;
            this.allowEdit = false;
            this.updateAccessControl();
        });
    }
    updateAccessControl = () => {
        if (!this.allowAccessControl && this.stepperController) {
            //deactivate the access control step
            this.stepperController.deactivateStep(3);
        }
        else if (this.stepperController) {
            this.stepperController.activateStep(3);
        }
    }
    cancelStepper = () => {
        //or just reset the url
        this.RegisterTemplateService.resetModel();
        this.stepperUrl = null;
        this.StateService.FeedManager().Template().navigateToRegisteredTemplates();
    }

    onStepperInitialized = (stepper: any) => {
        this.stepperController = stepper;
        if (!this.AccessControlService.isEntityAccessControlled()) {
            //disable Access Control
            stepper.deactivateStep(3);
        }
        this.updateAccessControl();
    }

}

angular.module(moduleName).component('registerTemplateController', {
    bindings: {
        $transition$: '<'
    },
    templateUrl: 'js/feed-mgr/templates/template-stepper/register-template.html',
    controller: RegisterTemplateController,
    controllerAs: 'vm'
});
