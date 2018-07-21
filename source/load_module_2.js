$vm.process_first_include=function(txt,pid,slot,callback,url_0,m_name){
	var lines=txt.split('\n');
	for(var i=0;i<lines.length;i++){
		if(lines[i].length>10){
			if(lines[i].indexOf('VmInclude:')!==-1){
				$vm.load_include(lines,i,pid,slot,callback,url_0,m_name); //find the first include and process
				return;
			}
		}
	}
}
//-----------------------------------
$vm.load_include=function(lines,i,pid,slot,callback,url_0,m_name){
	var name=lines[i].replace('VmInclude:','').trim();
	var items=name.split('|');
	var url=$vm.url(items[0]);
	if(url[0]=='/') url=$vm.hosting_path+url;
	//url=url.replace('__CURRENT_PATH__',_g_current_path);
	url=url.replace('__CURRENT_PATH__',$vm.vm[pid].current_path);
	//------------------------------
	var ver=localStorage.getItem(url+"_ver");
	var txt=localStorage.getItem(url+"_txt");

	var http127_i=0;
	if(url.indexOf('http://127.0.0.1')!=-1 || url.indexOf('http://localhost')!=-1) http127_i=1;
	else if($vm.localhost==true && url.indexOf('http://')==-1 && url.indexOf('https://')==-1){ //like modules/home.html
        http127_i=1;
        if(url[0]=='/') url=$vm.hosting_path+url;
        else url=$vm.hosting_path+"/"+url;
    }
	if(ver!=$vm.version || http127_i==1 || txt==null || $vm.reload!=''){
		var new_url=url+'?_v='+($vm.version+$vm.reload).replace(/\./,'')+"&g="+_g_vm_chrom_loop++;
		if(url.indexOf('?')!==-1) new_url=url+'&_v='+($vm.version+$vm.reload).replace(/\./,'')+"&g="+_g_vm_chrom_loop++;
		console.log('loading from url. '+new_url)
		$.get(new_url, function(data){
			if(items.length>1){
				for(var kk=0;kk<(items.length-1)/2;kk++){
					var k1=2*kk+1;
					var k2=2*kk+2;
					if(k1<items.length && k2<items.length){
						var re=new RegExp(items[k1], 'g');
						data=data.replace(re,items[k2]);
					}
				}
			}
			localStorage.setItem(url+"_txt",data);
			localStorage.setItem(url+"_ver",$vm.version);
			var current_all=$vm.replace_and_recreate_content(lines,i,data)
			if(current_all.indexOf('VmInclude:')==-1){
				$vm.create_module_and_run_code(current_all,pid,url_0,slot,m_name);
				$vm.insert_and_trigger_load(pid,slot,callback);
			}
			else{
				$vm.process_first_include(current_all,pid,slot,callback,url_0,m_name);
			}
		},'text');

	}
	else{
		console.log('loading from stotage. '+url)
		var current_all=$vm.replace_and_recreate_content(lines,i,txt)
		if(current_all.indexOf('VmInclude:')==-1){
			$vm.create_module_and_run_code(current_all,pid,url_0,slot,m_name);
			$vm.insert_and_trigger_load(pid,slot,callback);
		}
		else{
			$vm.process_first_include(current_all,pid,slot,callback,url_0,m_name);
		}
	}
}
//-----------------------------------
$vm.replace_and_recreate_content=function(lines,I,replace){
	lines[I]=replace;
	var all="";
	for(var j=0;j<lines.length;j++){
		all+=lines[j]+'\n';
	}
	return all;
}
//-----------------------------------
$vm.create_module_and_run_code=function(txt,pid,url,slot,m_name){
	//txt=txt.replace(/__CURRENT_PATH__/g,_g_current_path);
	txt=txt.replace(/__CURRENT_PATH__/g,$vm.vm[pid].current_path);
	var content=txt;
	if(m_name!=undefined && $vm.module_list[m_name]!=undefined){
		if($vm.module_list[m_name].full_content!=='1'){
			var c_m=$(content).filter('#D__ID').html();
			if(c_m!=undefined && c_m!='') content=c_m;
		}
	}
	content=$vm.url(content);
    if(m_name!=undefined && $vm.module_list[m_name]!=undefined){
		if($vm.module_list[m_name].html_filter!=undefined){
        	content=$vm.module_list[m_name].html_filter(content);
		}
    }
	content=content.replace(/__ID/g, pid);
	content=content.replace(/<!--([\s\S]*?)-->/mig, '');
	//-----------------
	if(slot!='body'){
		content="<div id=D"+pid+" module='"+m_name+"' class=vm_module style='display:none'><!--"+url+"-->"+content+"</div>"
		$("#D"+pid).remove();
		if(slot=='' || slot==undefined) slot=$vm.root_layout_content_slot;
		$("#"+slot).append($(content));
	}
	else{
		$("body").append($(content));
	}
	//-----------------
	if (typeof window['F'+pid] == 'function') {
		try{
			eval('F'+pid+"()");
		}
		catch(err){
			var module=url;
			if(module===undefined) module=pid;
			alert(err+"\r\nThis error happend in the module\r\n"+module);
		}
	}
	//-----------------------------------------
	$('#D'+pid).on('dblclick',function(event){
		event.stopPropagation();
		$vm.source(''+pid,event);
	});
	//-------------------------------------
	if($vm.vm_module_border!==undefined){
		$('div.vm_module').css("border","1px solid red");
	}
	//-------------------------------------
}
//-----------------------------------
$vm.insert_and_trigger_load=function(pid,slot,callback){
	if(slot!="body"){
		$vm.insert_module({pid:pid,slot:slot});
		$('#D'+pid).triggerHandler('load');
	}
	if(callback!==undefined) callback();
	$('#vm_loader').hide();
}
//-----------------------------------
$vm.show_module=function(pid,slot,op){
	if($vm.vm[pid].op!=undefined && op!=undefined){
		for (var a in op){
			$vm.vm[pid].op[a]=op[a];
		};
	}
	$vm.insert_module({pid:pid,slot:slot});
	$('#D'+pid).triggerHandler('load');
}
//-----------------------------------
_g_current_path='';
$vm.load_module=function(options){
	_g_vm_chrom_loop=0;
	//------------------------------
	var m_name=options.name;
	var callback=options.callback;
	var pid	=options.pid;
	var db_pid	=options.db_pid;
	var slot	=options.slot;
	var url=options.url;
	if(url[0]=='/') url=$vm.hosting_path+url;
	var last_part=url.split('/').pop();
    _g_current_path=url.replace(last_part,'');
	if(url===undefined) return;
	if($('#D'+pid).length===0){
		$vm.vm[pid]={};
	}
	$vm.vm[pid].parent_uid=undefined;
	$vm.vm[pid].parent_name="";
	$vm.vm[pid].excel_dialog="";
	$vm.vm[pid].current_path=_g_current_path;
	for (var a in options){
		$vm.vm[pid][a]=options[a];
	};
    $vm.vm[pid].input=options.op;
	//------------------------------
	if($('#D'+pid).length==0){
        //------------------------------
        //if(url.indexOf('http://')==-1 && url.indexOf('https://')==-1) url=$vm.hosting_path+"/"+url;
		//------------------------------
		var ver=localStorage.getItem(url+"_ver");
		var txt=localStorage.getItem(url+"_txt");
		var http127_i=0;
		if($vm.hosting_path.indexOf('http://127.0.0.1')!=-1 || $vm.hosting_path.indexOf('http://localhost')!=-1) http127_i=1;
		/*
		if(url.indexOf('http://127.0.0.1')!=-1 || url.indexOf('http://localhost')!=-1) http127_i=1;
		else if($vm.localhost==true && url.indexOf('http://')==-1 && url.indexOf('https://')==-1){ //like modules/home.html
            http127_i=1;
            if(url[0]=='/') url=$vm.hosting_path+url;
            else url=$vm.hosting_path+"/"+url;
        }
		*/
		var reload=0;
		if(window.location.toString().indexOf('reload='+m_name)!=-1){
			reload=1;
		}
		if(ver!=$vm.version || http127_i==1 || txt==null || $vm.reload!='' || reload==1){
			var new_url=url+'?_v='+($vm.version+$vm.reload).replace(/\./,'');
			if(url.indexOf('?')!==-1) new_url=url+'&_v='+($vm.version+$vm.reload).replace(/\./,'');
			console.log('loading from url. '+new_url)
            if(window.location.hostname!='127.0.0.1' && window.location.hostname!='localhost')	$('#vm_loader').show();
			$.get(new_url, function(data){
				//-----------------------------------
				//for images belong to this module
				if(data.indexOf('__CURRENT_NAME__')!=-1){
					var nm=new_url.split('/').pop().split('?')[0];
					data=data.replace(/__CURRENT_NAME__/g,nm);
				}
				//-----------------------------------
				localStorage.setItem(url+"_txt",data);
				localStorage.setItem(url+"_ver",$vm.version);
				var current_all=data;
				if(current_all.indexOf('VmInclude:')==-1){
					$vm.create_module_and_run_code(current_all,pid,url,slot,m_name);
					$vm.insert_and_trigger_load(pid,slot,callback);
				}
				else{
					$vm.process_first_include(current_all,pid,slot,callback,url,m_name);
				}
			}).fail(function() {
			    alert( "The file '"+url+"' doesn't exist!" );
			});
		}
		else{
			console.log('loading from stotage. '+url)
			var current_all=txt;
			if(current_all.indexOf('VmInclude:')==-1){
				$vm.create_module_and_run_code(current_all,pid,url,slot,m_name);
				$vm.insert_and_trigger_load(pid,slot,callback);
			}
			else{
				$vm.process_first_include(current_all,pid,slot,callback,url,m_name);
			}
		}
	}
	else $vm.insert_and_trigger_load(pid,slot,callback);
};
