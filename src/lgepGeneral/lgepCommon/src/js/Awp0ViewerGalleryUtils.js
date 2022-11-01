// Copyright 2020 Siemens Product Lifecycle Management Software Inc.

/**
 * Module for various CellList utilities
 *
 * @module js/Awp0ViewerGalleryUtils
 */
 import * as app from 'app';
 import viewModelObjectService from 'js/viewModelObjectService';
 import appCtx from 'js/appCtxService';
 import soaService from 'soa/kernel/soaService';
 import propPolicyService from 'soa/kernel/propertyPolicyService';
 import $ from 'jquery';
 import sourceEditorSvc from 'js/sourceEditor.service';
 
 import cdmSvc from 'soa/kernel/clientDataModel';

 var exports = {};
 
 /**
  * Gets the file URL from ticket
  *
  * @param {String} ticket the file ticket
  * @return {String} file URL resolved from ticket
  */
 var getFileUrl = function( ticket ) {
     return 'fms/fmsdownload/?ticket=' + ticket;
 };
 
 /**
  * Builds the header properties with commands to be shown over the viewer
  *
  * @param {String} ticket the file ticket
  * @param {Object} object whose property needs to be extracted
  * @param {ObjectArray} property list
  * @param {ObjectArray} command list
  * @param {Boolean} whether to attach command
  */
 var buildHeaderProperties = function( headerProperties, object, viewerHeaderProps, commands, addCommand ) {
     for( var idx in headerProperties.dbValue ) {
         var propertyName = headerProperties.dbValue[ idx ];
         var eachHeaderProp = {};
         eachHeaderProp.property = object.props[ propertyName ];
 
         if( propertyName === 'object_name' && eachHeaderProp.property ) {
             eachHeaderProp.property.propertyDisplayName = eachHeaderProp.property.uiValue;
         }
         if( idx === '0' && addCommand ) {
             eachHeaderProp.commands = [ commands.dbValue[ 2 ], commands.dbValue[ 3 ], commands.dbValue[ 4 ],
                 commands.dbValue[ 5 ]
             ];
         }
 
         viewerHeaderProps.push( eachHeaderProp );
     }
 };
 
 /**
  * Get the default data set
  *
  * @param {Object} inData - declarative data
  */
 export let showViewer = function( inData ) {
     var datasetVM = null;
     var fileVM = null;

     //TODO: Custom File Preview Added
     var promise = new Promise((resolve, reject) => {
         if( appCtx.ctx.selected.type == "L2_SVG" ) {
            _loadCustomViewer("Awp0ImageViewer", "L2_SVG", inData, resolve);
         } else if ( appCtx.ctx.selected.type == "Text" ) {
            _loadCustomViewer("L2_VideoViewer", "Text", inData, resolve);
         }  else if ( appCtx.ctx.selected.type == "Fnd0VideoData" ) {
            _loadCustomViewer("L2_VideoViewer", "Fnd0VideoData", inData, resolve);
         } else {
            resolve(true);
         }
     }).then( (success) => {
        if(success) {
            //viewmodelobjectservice logs console error in case nulltag i.e. AAAAAAAAAAAAAA uid is sent to it
            //prevent such errors by creating view model object for non-null uid's only. Null tags are represented
            //by objectID holding value ""
            if( inData && inData.viewerData && !inData.viewerData.headerProperties ) {
                if( inData.viewerData.dataset && inData.viewerData.dataset.objectID !== '' ) {
                    datasetVM = viewModelObjectService.createViewModelObject( inData.viewerData.dataset.uid, '' );
                }
        
                if( inData.viewerData.views && inData.viewerData.views.length > 0 &&
                    inData.viewerData.views[ 0 ].file.objectID !== '' ) {
                    fileVM = viewModelObjectService.createViewModelObject( inData.viewerData.views[ 0 ].file.uid, '' );
                }
        
                if( datasetVM !== null && fileVM !== null ) {
                    inData.viewerData = {
                        datasetData: datasetVM,
                        fileData: inData.viewerData.views[ 0 ],
                        hasMoreDatasets: inData.viewerData.hasMoreDatasets
                    };
        
                    inData.viewerData.fileData.file = fileVM;
                    // TODO: ootb fix point
                    // //console.log(fileVM);
                    if (fileVM.thumbnailURL == '') {
                       inData.viewerData.fileData.fileUrl = datasetVM.thumbnailURL;
                    } else {
                        inData.viewerData.fileData.fileUrl = getFileUrl( inData.viewerData.fileData.fmsTicket );
                    }
                    // TODO: ootb fix end
        
                    var viewerHeaderProperties = [];
                    if( inData.headerProperties1 ) {
                        buildHeaderProperties( inData.headerProperties1, datasetVM, viewerHeaderProperties,
                            inData.commands, true );
                    }
                    if( inData.headerProperties2 ) {
                        buildHeaderProperties( inData.headerProperties2, fileVM, viewerHeaderProperties, inData.commands,
                            false );
                    }
                    inData.viewerData.headerProperties = viewerHeaderProperties;
                } else {
                    // LCS-168799
                    // Check if fileData is already on viewerData - happen when showViewer is called twice
                    if( inData.viewerData && !inData.viewerData.fileData ) {
                        inData.viewerData = {
                            fileData: {
                                file: {},
                                fmsTicket: '',
                                viewer: inData.viewerData.views[ 0 ].viewer
                            },
                            hasMoreDatasets: inData.viewerData.hasMoreDatasets
                        };
                    }
                }
            }
        }
     }).catch((ex) => {
        throw new Error(ex);
     })
 };
 
 /**
  * Toggle the word wrap in text viewer
  */
 export let toggleWordWrap = function() {
     var ctx = appCtx.getCtx( 'viewerContext' );
     if( ctx && ctx.showWordWrap ) {
         ctx.wordWrapped = !ctx.wordWrapped;
 
         var textPage = $( '#aw-text-page' );
         var textLines = $( '#aw-text-lines' );
         if( textPage.length > 0 && textLines.length > 0 ) {
             textLines.toggleClass( 'aw-viewerjs-wordWrapped' );
             textPage.css( 'width', ctx.wordWrapped ? 'auto' : textPage.css( 'maxWidth' ) );
         } else {
             sourceEditorSvc.updateOptions( 'awCodeEditor', { wordWrap: ctx.wordWrapped } );
         }
     }
 };
 
 /**
  * Retrieve and reloads the viewer.
  *
  * @param {Object} declViewModel - view model
  * @returns {Promise} promise after loading viewer data
  */
 export let refetchViewer = function( declViewModel ) {
     var selectedObject = appCtx.getCtx( 'selected' );
 
     var getViewerDataInput = {
         inputs: {
             dataset: '',
             direction: '',
             obj: selectedObject
         }
     };
 
     var propPolicy = {
         types: [ {
             name: 'Dataset',
             properties: [ {
                 name: 'object_name'
             }, {
                 name: 'object_type'
             }, {
                 name: 'last_mod_date'
             }, {
                 name: 'ref_list',
                 modifiers: [ {
                     name: 'withProperties',
                     Value: 'true'
                 } ]
             }, {
                 name: 'checked_out'
             }, {
                 name: 'checked_out_user'
             }, {
                 name: 'is_modifiable'
             }, {
                 name: 'fnd0IsCheckoutable'
             } ]
         }, {
             name: 'ImanFile',
             properties: [ {
                 name: 'file_size'
             } ]
         } ]
     };
 
     var propPolicyId = propPolicyService.register( propPolicy );
 
     return soaService.post( 'Internal-AWS2-2017-06-DataManagement', 'getViewerData', getViewerDataInput ).then(
         function( response ) {
             if( response.output ) {
                 declViewModel.viewerData = response.output;
 
                 declViewModel.headerProperties1 = {
                     isArray: 'true',
                     dbValue: [ 'object_name', 'object_type', 'last_mod_date' ]
                 };
 
                 declViewModel.headerProperties2 = {
                     isArray: 'true',
                     dbValue: [ 'file_size' ]
                 };
 
                 declViewModel.commands = {
                     isArray: 'true',
                     dbValue: [ {
                             action: 'onPreviousChevronClick',
                             iconName: 'miscChevronLeft',
                             tooltip: '{{i18n.previousButtonTitle}}'
                         },
                         {
                             action: 'onNextChevronClick',
                             iconName: 'miscChevronRight',
                             tooltip: '{{i18n.nextButtonTitle}}'
                         }
                     ]
                 };
 
                 exports.showViewer( declViewModel );
             }
             propPolicyService.unregister( propPolicyId );
         }
     );
 };


 function _loadCustomViewer(viewerName, DatasetType, inData, resolve) {
    soaService.post("Core-2007-09-DataManagement", "loadObjects", {uids: [appCtx.ctx.selected.uid]}, {
        "types": [
            {
                "name": DatasetType,
                "properties": [
                    { "name": "ref_list" }
                ]
            }],
        "useRefCount": false
    }).then( () => {
        let imanFileUid = appCtx.ctx.selected.props.ref_list.dbValues[0];
        let imanFile = cdmSvc.getObject(imanFileUid);

        let request = {
            files: [imanFile]
        };
        soaService.post("Core-2006-03-FileManagement", "getFileReadTickets", request).then( (response) => {
            // //console.log(response);
            inData.viewerData = {};
            inData.viewerData.dataset = appCtx.ctx.selected;
            inData.viewerData.hasMoreDatasets = false;
            inData.viewerData.views = [];
            inData.viewerData.views.push({
                file: response.tickets[0][0],
                fmsTicket: response.tickets[1][0],
                viewer: viewerName
            });
            if(DatasetType == "Text") {
                fetch(getFileUrl(response.tickets[1][0])).then( (res) => {
                    res.arrayBuffer().then( (arrayBuffer) => {
                        const chars = new Uint8Array(arrayBuffer);
                        var string = new TextDecoder().decode(chars);
                        appCtx.ctx.preview = string;
                    })
                })
            } else if (DatasetType == "Fnd0VideoData") {
                if(imanFile.props.original_file_name.dbValues[0].endsWith(".avi")) {
                    appCtx.ctx.preview = "AVI File is not supported. Please contact your administrator.";
                    appCtx.ctx.support = false;
                    return;
                }
                appCtx.ctx.preview = getFileUrl(response.tickets[1][0]);
                appCtx.ctx.support = true;
            }
        }).catch((ex) => {
            throw new Error(ex);
        }).finally( () => {
            resolve(true);
        })
    })
 }
 
 export default exports = {
     showViewer,
     toggleWordWrap,
     refetchViewer
 };
 
 /**
  * This service provides view model object
  *
  * @memberof NgServices
  * @member viewModelObject
  */
 app.factory( 'Awp0ViewerGalleryUtils', () => exports );
 