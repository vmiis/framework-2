$vm.uploading_file_v3=function(res,file,callback){
    if(file){
        var s3_upload_url=res['file_'+file.name];
        $vm.open_dialog({name:'uploading_file_dialog_module'});
		var mid=$vm.module_list['uploading_file_dialog_module']['table_id'];
        var url=$vm.module_list['uploading_file_dialog_module']['url'];
        var pid=$vm.id(url+mid);
        $('#progress'+pid).text('Uploading...');
        $.ajax({
            xhr: function(){
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(evt){
                    $('#progress'+pid).text(evt.loaded);
                }, false);
                return xhr;
            },
            url : s3_upload_url,
            type : "PUT",
            data : file,
            headers: {'Content-Type': file.type },
            cache : false,
            processData : false
        })
        .done(function() {
            $vm.close_dialog({name:'uploading_file_dialog_module'});
            if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)){
                $vm.uploading_thumb_v3(res,file,function(){
                    callback();
                });
            }
            else callback();
        })
        .fail(function(e) {
            alert('Upload error');
        });
    }
}
//---------------------------------------------
$vm.uploading_thumb_v3=function(res,file,callback){
    var get_thumbnail=function(e){
        var s3_upload_url=res['thumb_'+file.name]
        var myCan=document.createElement('canvas');
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            myCan.width = 80;;
            myCan.height = 80*img.height/img.width;
            if (myCan.getContext) {
                var cntxt = myCan.getContext("2d");
                cntxt.drawImage(img, 0, 0, myCan.width, myCan.height);
                var dataURL=myCan.toDataURL();
                var blobBin = atob(dataURL.split(',')[1]);
                var array = [];
                for(var i = 0; i < blobBin.length; i++) {
                    array.push(blobBin.charCodeAt(i));
                }
                var new_file=new Blob([new Uint8Array(array)], {type: 'image/'+file.type});
                $vm.open_dialog({name:'uploading_file_dialog_module'});
        		var	mid=$vm.module_list['uploading_file_dialog_module']['table_id'];
        	    var url=$vm.module_list['uploading_file_dialog_module']['url'];
                var pid=$vm.id(url+mid);
                $('#progress'+pid).text('Uploading...');
                $.ajax({
                    xhr: function(){
                        var xhr = new window.XMLHttpRequest();
                        xhr.upload.addEventListener("progress", function(evt){
                            $('#progress'+pid).text(evt.loaded);
                        }, false);
                        return xhr;
                    },
                    url : s3_upload_url,
                    type : "PUT",
                    data : new_file,
                    headers: {'Content-Type': file.type },
                    cache : false,
                    processData : false
                })
                .done(function() {
                    $vm.close_dialog({name:'uploading_file_dialog_module'});
                    callback();
                })
                .fail(function(e) {
                    alert('Upload error');
                });
            }
        }
    }
    //--------------------
    if(file){
        var reader = new FileReader();
        reader.onload = get_thumbnail;
        reader.readAsDataURL(file);
    }
    //--------------------
}
//---------------------------------------------
