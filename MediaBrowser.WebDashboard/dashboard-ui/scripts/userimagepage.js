﻿(function ($, window, document, FileReader) {

    var currentFile;

    function reloadUser(page) {

        var userId = getParameterByName("userId");

        Dashboard.showLoadingMsg();

        ApiClient.getUser(userId).done(function (user) {

            $('#uploadUserImage', page).val('').trigger('change');

            Dashboard.setPageTitle(user.Name);

            if (user.PrimaryImageTag) {

                var imageUrl = ApiClient.getUserImageUrl(user.Id, {
                    height: 450,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                });

                $('#fldImage', page).show().html('').html("<img height='200px' src='" + imageUrl + "' />");

                $('#fldDeleteImage', page).show();
                $('#headerUploadNewImage', page).show();
            } else {
                $('#fldImage', page).hide().html('');
                $('#fldDeleteImage', page).hide();
                $('#headerUploadNewImage', page).hide();
            }

            Dashboard.hideLoadingMsg();
        });

    }

    function processImageChangeResult() {

        Dashboard.hideLoadingMsg();

        var page = $.mobile.activePage;

        Dashboard.validateCurrentUser(page);
        reloadUser(page);
    }

    function onFileReaderError(evt) {

        Dashboard.hideLoadingMsg();

        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                Dashboard.showError('File Not Found!');
                break;
            case evt.target.error.NOT_READABLE_ERR:
                Dashboard.showError('File is not readable');
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                Dashboard.showError('An error occurred reading this file.');
        };
    }

    function onFileReaderOnloadStart(evt) {

        $('#fldUpload', $.mobile.activePage).hide();
    }

    function onFileReaderAbort(evt) {

        Dashboard.hideLoadingMsg();
        Dashboard.showError('File read cancelled');
    }

    function setFiles(page, files) {

        var file = files[0];

        if (!file || !file.type.match('image.*')) {
            $('#userImageOutput', page).html('');
            $('#fldUpload', page).hide();
            currentFile = null;
            return;
        }

        currentFile = file;

        var reader = new FileReader();

        reader.onerror = onFileReaderError;
        reader.onloadstart = onFileReaderOnloadStart;
        reader.onabort = onFileReaderAbort;

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {

                // Render thumbnail.
                var html = ['<img style="max-width:500px;max-height:200px;" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');

                $('#userImageOutput', page).html(html);
                $('#fldUpload', page).show();
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsDataURL(file);
    }

    function onImageDrop(e) {

        e.preventDefault();

        setFiles($.mobile.activePage, e.originalEvent.dataTransfer.files);

        return false;
    }

    function onImageDragOver(e) {

        e.preventDefault();

        e.originalEvent.dataTransfer.dropEffect = 'Copy';

        return false;
    }

    function userImagePage() {

        var self = this;

        self.onSubmit = function () {

            var file = currentFile;

            if (!file) {
                return false;
            }

            if (file.type != "image/png" && file.type != "image/jpeg" && file.type != "image/jpeg") {
                return false;
            }

            Dashboard.showLoadingMsg();

            var userId = getParameterByName("userId");

            ApiClient.uploadUserImage(userId, 'Primary', file).done(processImageChangeResult);

            return false;
        };

        self.deleteImage = function () {

            Dashboard.confirm("Are you sure you wish to delete the image?", "Delete Image", function (result) {

                if (result) {

                    Dashboard.showLoadingMsg();

                    var userId = getParameterByName("userId");

                    ApiClient.deleteUserImage(userId, "primary").done(processImageChangeResult);
                }

            });
        };

        self.onFileUploadChange = function (fileUpload) {

            setFiles($.mobile.activePage, fileUpload.files);
        };
    }

    window.UserImagePage = new userImagePage();

    $(document).on('pagebeforeshow', "#userImagePage", function () {

        var page = this;

        Dashboard.getCurrentUser().done(function (loggedInUser) {

            if (loggedInUser.Configuration.IsAdministrator) {
                $('.lnkMediaLibrary', page).show().prev().removeClass('ui-last-child');
            } else {
                $('.lnkMediaLibrary', page).hide().prev().addClass('ui-last-child');
            }
        });

    }).on('pageshow', "#userImagePage", function () {

        var page = this;

        reloadUser(page);

        $("#userImageDropZone", page).on('dragover', onImageDragOver).on('drop', onImageDrop);

    }).on('pagehide', "#userImagePage", function () {

        var page = this;

        $("#userImageDropZone", page).off('dragover', onImageDragOver).off('drop', onImageDrop);
    });


})(jQuery, window, document, window.FileReader);