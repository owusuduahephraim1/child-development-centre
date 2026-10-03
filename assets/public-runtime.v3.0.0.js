/* Child Development Centre — consolidated public runtime v2.3.9
   One public Neon client for theme, Google Maps and videos.
   Keeps Contact synchronization targeted and supports the final professional theme pack. */
(function(){
  'use strict';
  var cfg=window.CDC_CONFIG||{};
  var THEMES={classic_forest:true,royal_blue:true,warm_gold:true,earth_hope:true,slate_teal:true,midnight_gold:true,heritage_burgundy:true,sage_cream:true,high_contrast:true};
  var approvedMapUrl='';
  var clientPromise=null;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeHttps(raw){try{var u=new URL(String(raw||''));return u.protocol==='https:'?u.href:''}catch(e){return''}}
  function externalVideo(raw){try{var u=new URL(String(raw||''));return u.protocol==='https:'&&(u.hostname==='youtu.be'||/(^|\.)youtube\.com$/i.test(u.hostname)||/(^|\.)vimeo\.com$/i.test(u.hostname))}catch(e){return false}}
  function managedVideo(v){return v&&v.storage_provider==='cloudflare-r2'&&!!safeHttps(v.video_url)}
  function youtubeId(raw){try{var u=new URL(raw);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(/(^|\.)youtube\.com$/i.test(u.hostname))return u.searchParams.get('v')||(u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)||[])[1]||''}catch(e){}return''}
  function thumb(v){var t=String(v.thumbnail_url||'');if(/^data:image\//i.test(t)||safeHttps(t))return t;var id=youtubeId(v.video_url);return id?'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg':''}

  function extractMapUrl(raw){
    var value=String(raw||'').trim();
    if(!value)return'';
    if(/^</.test(value)){
      try{
        var doc=new DOMParser().parseFromString(value,'text/html');
        var iframe=doc.querySelector('iframe[src]');
        if(iframe)value=String(iframe.getAttribute('src')||'').trim();
      }catch(e){return''}
    }
    try{
      var url=new URL(value,location.href),host=url.hostname.toLowerCase();
      if(url.protocol!=='https:')return'';
      if(host!=='www.google.com'&&host!=='maps.google.com')return'';
      if(url.pathname.indexOf('/maps/embed')!==0)return'';
      return url.href;
    }catch(e){return''}
  }

  function ensureMap(){
    var frame=document.getElementById('contactMap');
    if(!frame||!approvedMapUrl)return false;
    if(frame.getAttribute('src')!==approvedMapUrl)frame.setAttribute('src',approvedMapUrl);
    frame.loading='lazy';
    frame.referrerPolicy='no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen','');
    frame.title='Child Development Centre location map';
    frame.hidden=false;
    return true;
  }

  function watchMap(){
    var frame=document.getElementById('contactMap');
    if(!frame)return;
    var queued=false;
    new MutationObserver(function(){
      if(!approvedMapUrl||queued)return;
      queued=true;
      queueMicrotask(function(){queued=false;ensureMap()});
    }).observe(frame,{attributes:true,attributeFilter:['src','hidden']});
  }

  function whatsappDigits(raw){
    var digits=String(raw||'').replace(/\D/g,'');
    if(digits.indexOf('00')===0)digits=digits.slice(2);
    if(digits.length===10&&digits.charAt(0)==='0')digits='233'+digits.slice(1);
    return digits;
  }

  function enhanceWhatsApp(){
    var host=document.getElementById('contactDetails');
    if(!host)return false;
    var cards=host.querySelectorAll('p');
    for(var i=0;i<cards.length;i++){
      var card=cards[i],label=card.querySelector('strong');
      var labelText=label?String(label.textContent||'').trim().toLowerCase().replace(/:\s*$/,''):'';
      if(labelText!=='whatsapp')continue;
      if(card.querySelector('a.nis-whatsapp-link'))return true;
      var clone=card.cloneNode(true),cloneLabel=clone.querySelector('strong');
      if(cloneLabel)cloneLabel.remove();
      var raw=String(clone.textContent||'').trim().replace(/^:\s*/,'');
      var digits=whatsappDigits(raw);
      if(!digits)return false;
      var link=document.createElement('a');
      link.className='nis-whatsapp-link';link.href='https://wa.me/'+digits;link.target='_blank';link.rel='noopener noreferrer';link.textContent=raw;
      link.setAttribute('aria-label','Chat on WhatsApp with '+raw);link.title='Open WhatsApp chat';
      while(label.nextSibling)card.removeChild(label.nextSibling);
      card.appendChild(document.createTextNode(' '));card.appendChild(link);
      return true;
    }
    return false;
  }

  function watchWhatsApp(){
    var host=document.getElementById('contactDetails');
    if(!host)return;
    enhanceWhatsApp();
    var queued=false;
    new MutationObserver(function(){
      if(queued)return;queued=true;
      queueMicrotask(function(){queued=false;enhanceWhatsApp()});
    }).observe(host,{childList:true,subtree:true,characterData:true});
  }

  function ensureVideoSection(){
    var s=document.getElementById('videos');
    if(!s){
      s=document.createElement('section');s.id='videos';s.className='section section-soft nis-video-section';s.hidden=true;
      var g=document.getElementById('gallery'),stories=document.getElementById('stories');
      if(g&&g.parentNode)g.parentNode.insertBefore(s,g);else if(stories&&stories.parentNode)stories.parentNode.insertBefore(s,stories.nextSibling);
    }
    s.innerHTML='<div class="container"><p class="eyebrow dark">Video Stories</p><div class="section-heading"><h2>Appreciation, testimony and moments of impact</h2><p>Approved video messages and field updates from our community, partners and programmes.</p></div><div id="nisVideoGrid" class="nis-video-grid"></div></div>';
    return s;
  }

  function ensureVideoNav(){
    var nav=document.getElementById('primaryNav');if(!nav||nav.querySelector('a[href="#videos"]'))return;
    var a=document.createElement('a');a.href='#videos';a.textContent='Videos';
    var gallery=nav.querySelector('a[href="#gallery"]');nav.insertBefore(a,gallery||nav.lastElementChild);
  }

  function renderVideos(rows){
    rows=(rows||[]).filter(function(v){return managedVideo(v)||externalVideo(v.video_url)});
    if(!rows.length)return;
    var s=ensureVideoSection(),grid=document.getElementById('nisVideoGrid');
    grid.innerHTML=rows.map(function(v){
      var org=v.organisation_type==='school'?'Nipe International School':v.organisation_type==='joint'?'Joint':'Child Development Centre';
      var meta=esc(v.category||'Video')+' · '+esc(org),p=thumb(v);
      if(managedVideo(v))return '<article class="nis-video-card nis-uploaded-video-card"><video class="nis-public-video" controls preload="none" playsinline '+(p?'poster="'+esc(p)+'"':'')+'><source src="'+esc(v.video_url)+'" type="'+esc(v.mime_type||'video/mp4')+'">Your browser does not support HTML5 video.</video><div class="nis-video-body"><span class="nis-video-meta">'+meta+'</span><h3>'+esc(v.title)+'</h3>'+(v.description?'<p>'+esc(v.description)+'</p>':'')+'</div></article>';
      return '<article class="nis-video-card"><a class="nis-video-thumb" href="'+esc(v.video_url)+'" target="_blank" rel="noopener noreferrer">'+(p?'<img loading="lazy" decoding="async" src="'+esc(p)+'" alt="'+esc(v.title)+' video thumbnail">':'')+'<span class="nis-video-play">▶</span></a><div class="nis-video-body"><span class="nis-video-meta">'+meta+'</span><h3>'+esc(v.title)+'</h3>'+(v.description?'<p>'+esc(v.description)+'</p>':'')+'<a class="nis-video-link" href="'+esc(v.video_url)+'" target="_blank" rel="noopener noreferrer">Watch video →</a></div></article>';
    }).join('');
    s.hidden=false;ensureVideoNav();
  }

  async function getClient(){
    if(clientPromise)return clientPromise;
    clientPromise=(async function(){
      if(!cfg.neonAuthUrl||!cfg.neonDataApiUrl)return null;
      var mod=await import('https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm');
      return mod.createClient({auth:{adapter:mod.SupabaseAuthAdapter(),url:cfg.neonAuthUrl,allowAnonymous:true},dataApi:{url:cfg.neonDataApiUrl}});
    })();
    return clientPromise;
  }

  async function loadSettingsAndMap(){
    try{
      var client=await getClient();if(!client)return;
      var result=await client.from('website_settings').select('key,value').in('key',['theme_name','map_embed_url']);
      if(result.error)throw new Error(result.error.message);
      var settings={};(result.data||[]).forEach(function(r){settings[r.key]=r.value});
      var key=THEMES[settings.theme_name]?settings.theme_name:'classic_forest';
      document.documentElement.dataset.nisTheme=key;
      approvedMapUrl=extractMapUrl(settings.map_embed_url||'');
      if(approvedMapUrl)ensureMap();
    }catch(e){
      document.documentElement.dataset.nisTheme=document.documentElement.dataset.nisTheme||'classic_forest';
      console.error('Public settings/map load failed',e);
    }
  }

  async function loadVideos(){
    try{
      var client=await getClient();if(!client)return;
      var result=await client.from('media_videos')
        .select('id,title,description,category,video_url,thumbnail_url,organisation_type,is_featured,sort_order,created_at,storage_provider,mime_type')
        .eq('is_published',true).eq('publication_approved',true)
        .order('is_featured',{ascending:false}).order('sort_order').order('created_at',{ascending:false}).limit(12);
      if(result.error)throw new Error(result.error.message);
      renderVideos(result.data||[]);
    }catch(e){console.error('Public video load failed',e)}
  }

  function start(){
    watchWhatsApp();watchMap();
    setTimeout(loadSettingsAndMap,140);
    if('requestIdleCallback' in window)requestIdleCallback(loadVideos,{timeout:1500});else setTimeout(loadVideos,650);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
