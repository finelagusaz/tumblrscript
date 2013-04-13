// ==UserScript==
// @name        Tumblr Tornado
// @namespace   https://github.com/poochin
// @version     1.2.9.18
// @description Tumblr にショートカットを追加するユーザスクリプト
// @include     http://www.tumblr.com/dashboard
// @include     http://www.tumblr.com/dashboard?oauth_token=*
// @include     http://www.tumblr.com/dashboard/*
// @include     http://www.tumblr.com/reblog/*
// @include     http://www.tumblr.com/likes
// @include     http://www.tumblr.com/likes/*
// @include     http://www.tumblr.com/blog/*
// @include     http://www.tumblr.com/tagged/*
// @include     http://www.tumblr.com/show/*
// @include     http://www.tumblr.com/liked/by/*
// @require     http://static.tumblr.com/lf1ujxx/bczmf4vbs/sha1.js
// @require     http://static.tumblr.com/lf1ujxx/5bBmf4vcf/oauth.js
//
// @author      poochin
// @license     MIT
// @updated     2013-03-20
// @updateURL   https://github.com/poochin/tumblrscript/raw/master/userscript/tumblr_tornado.user.js
// ==/UserScript==

// TODO: customkey を class 化します
// TODO: customkey に expr を定義します
// TODO: var CustomFuncs を定義し Tornado.customfuncs とつなげます
/**
 * @namespace TumblrTornado
 */
(function TumblrTornado() {
    'use strict';

    var Tornado = {};
    var Etc; /* Tornado.etc へのショートハンドです */

    /*-- ここから Tornado オブジェクト の仮属性(ここ以外の場所で初期化されます) --*/
    Tornado.funcs = {};
    Tornado.vals = {};
    Etc = Tornado.etc = {};

    Tornado.customkeys = [];
    Tornado.customfuncs = {};

    Tornado.clientfuncs = [];
    Tornado.clientlaunches = [];

    Tornado.windows = {};

    Tornado.oauthconfigs = [
        {
            id: '',
            token: '',
            token_secret: '',
            tumblelogs: [
                {
                    name: '',
                    hostname: '',
                },
            ],
        },
    ];
    Tornado.exclude_tumblelogs = {}; // API 用であります
    Tornado.i18n = {};

    Tornado.tumblelog_configs = {
        name: {
            twitterOn: true || false,
        },
    };

    Tornado.oauth = {};
    /*-- /ここまで Tornado オブジェクトの仮属性 --*/

    Tornado.lang = window.navigator.language.split('-')[0];
    Tornado.gm_api = (typeof GM_info != 'undefined' ? true : false);

    Tornado.browser = (window.opera ? 'opera'
                    :  window.navigator.userAgent.match(/Chrome/) ? 'chrome'
                    :  window.navigator.userAgent.match(/Firefox/) ? 'firefox'
                    :  '');

    Tornado.vals.CONSUMER_KEY = 'kgO5FsMlhJP7VHZzHs1UMVinIcM5XCoy8HtajIXUeo7AChoNQo';
    Tornado.vals.CONSUMER_SECRET = 'wYZ7hzCu5NnSJde8U2d7BW6pz0mtMMAZCoGgGKnT4YNB8uZNDL';

    Tornado.vals.CONTENTTYPE_URLENCODED = ["Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"];

    Tornado.vals.KEY_MAX_FOLLOWS = 2;
    Tornado.vals.KEY_CONTINUAL_TIME = 2000;

    Tornado.vals.prev_cursor = null;
    Tornado.vals.state_texts = {
        '0': '',
        '1': 'draft',
        '2': 'queue',
        'private': 'private'
    };
    Tornado.vals.key_input_time = 0;
    Tornado.vals.key_follows = []
    

    Tornado.css = "";
    
    /* Pin Notification */
    Tornado.css += [
        "#pin_notification_board {",
        "    position: fixed;",
        "    right: 15px;",
        "    bottom: 0;",
        "}",
        ".pin_notification.error {",
        "    color: red;",
        "}",
        ".pin_notification {",
        "    -webkit-animation: pin_notification_animation 3s forwards;",
        "    -moz-animation: pin_notification_animation 3s forwards;",
        "    -o-animation: pin_notification_animation 3s forwards;",
        "    padding: 5px;",
        "    border-left: 2px solid #888;",
        "    border-right: 2px solid #888;",
        "    border-bottom: 1px dashed #696;",
        "    background: #efefef;",
        "}",
        ".pin_notification:first-child {",
        "    border-top-left-radius: 5px;",
        "    border-top-right-radius: 5px;",
        "    border-top: 2px solid #888;",
        "}",
        ".pin_notification:last-child {",
        "    margin-bottom: 8px;",
        "    border-bottom-left-radius: 5px;",
        "    border-bottom-right-radius: 5px;",
        "    border-bottom: 2px solid #888;",
        "}",
        ".pin_notification:last-child:after {",
        "    content: ' ';",
        "    display: block;",
        "    position: absolute;",
        "    height: 0;",
        "    width: 0;",
        "    margin-top: 5px;",
        "    margin-left: 5px;",
        "    border: 8px solid #efefef;",
        "    border-color: transparent;",
        "    border-top-color: #888;",
        "    border-bottom-width: 0px;",
        "}",
        "@-webkit-keyframes pin_notification_animation {",
        "    0%   { opacity: 0; }",
        "    5%   { opacity: 1; }",
        "    90%  { opacity: 1; }",
        "    100% { opacity: 0; }",
        "}",
        "@-moz-keyframes pin_notification_animation {",
        "    0%   { opacity: 0; }",
        "    5%   { opacity: 1; }",
        "    90%  { opacity: 1; }",
        "    100% { opacity: 0; }",
        "}",
        "@keyframes pin_notification_animation {",
        "    0%   { opacity: 0; }",
        "    5%   { opacity: 1; }",
        "    90%  { opacity: 1; }",
        "    100% { opacity: 0; }",
        "}",
    ].join('\n');

    /* Reblog Effect */
    Tornado.css += [
        /* Reblog Shutter */
        "#posts > .post.shutter_base {",
        "    background-color: #F8ABA6;",
        "}",
        "#posts > .post.shutter_base.shuttering {",
        "    -webkit-transition: background-color 0.08s ease;",
        "    -moz-transition: background-color 0.08s ease;",
        "    -o-transition: background-color 0.08s ease;",
        "    transition: background-color 0.08s ease;",
        "    background-color: #fff;",
        "}",
        /* Reblog Button */
        ".reblog_button.loading {",
        // "    background-position: -530px -270px !important;",
        "    -webkit-animation: reblogging 1s infinite;",
        "    -moz-animation: reblogging 1s infinite;",
        "}",
        "@-webkit-keyframes reblogging {",
        "  0% { -webkit-transform: rotate(0deg) scale(1.5, 1.5); }",
        "  25% { -webkit-transform: rotate(360deg) scale(1, 1); }",
        "  40% { -webkit-transform: rotate(360deg) scale(1, 1); }",
        "  50% { -webkit-transform: rotate(360deg) scale(1.1, 1.1); }",
        "  55% { -webkit-transform: rotate(360deg) scale(1, 1); }",
        "  100% { -webkit-transform: rotate(360deg) scale(1, 1); }",
        "}",
        "@-moz-keyframes reblogging {",
        "  0% { -moz-transform: rotate(0deg) scale(1.5, 1.5); }",
        "  25% { -moz-transform: rotate(360deg) scale(1, 1); }",
        "  40% { -moz-transform: rotate(360deg) scale(1, 1); }",
        "  50% { -moz-transform: rotate(360deg) scale(1.1, 1.1); }",
        "  55% { -moz-transform: rotate(360deg) scale(1, 1); }",
        "  100% { -moz-transform: rotate(360deg) scale(1, 1); }",
        "}"
    ].join('\n');

    /* Lite Dialog */
    Tornado.css += [
        ".lite_dialog {",
        "  background-color: #fff;",
        "  padding: 2px;",
        "  z-index: 10;",
        "  position: absolute;",
        "  top: 0;",
        "  left: 0;",
        "  border-radius: 3px;",
        "  -webkit-box-shadow: 0 0 6px #000;",
        "  -moz-box-shadow: 0 0 6px #000;",
        "  box-shadow: 0 0 6px #000;",
        "  opacity: 0.98;",
        "  z-index: 100;",
        "}",
        ".lite_dialog_sysbar { }",
        ".lite_dialog_sysbar:after {",
        "  content: '';",
        "  clear: both;",
        "  height: 0;",
        "  display: block;",
        "  visibility: hidden;",
        "}",
        ".lite_dialog_close {",
        "  line-height: 16px;",
        "  width: 16px;",
        "  color: #888;",
        "  border: 1px dashed #888;",
        "  border-radius: 3px;",
        "  float: right;",
        "  cursor: pointer;",
        "  font-family: monospace;",
        "  text-align: center;",
        "}",
        ".lite_dialog_close:hover {",
        "  background-color: #ddd;",
        "}",
        ".lite_dialog_close:active, .lite_dialog_close:focus {",
        "  color: #aaa;",
        "}",
        ".lite_dialog_caption {",
        "  font-weight: bold;",
        "  margin-right: 20px;",
        "  padding: 5px;",
        "  line-height: 16px;",
        "  font-size: 12px;",
        "  color: #444;",
        "  cursor: move;",
        "  border-radius: 3px;",
        "}",
        ".lite_dialog_caption:hover {",
        "  background-color: #f8f8f8;",
        "}",
        ".lite_dialog_body {",
        "  margin-top: 2px;",
        "  padding: 3px;",
        "  border-top: 1px dotted #000;",
        "  border-radius: 3px;",
        "}",
        ".lite_dialog_body input[type='button'] {",
        "  text-align: left;",
        "  font-size: 24px;",
        "  width: 100%;",
        "}",
        ".lite_dialog_body input[type='button']:focus {",
        "  font-weight: bold;",
        "}",
    ].join('\n');

    /* Lite Dialog, Tornado Extending */
    Tornado.css += [
        /* Channel Dialog */
        ".lite_dialog.channel_dialog {",
        "    min-width: 300px;",
        "    max-width: 300px;",
        "}",
        ".lite_dialog.channel_dialog .lite_dialog_body p {",
        "    margin: 0;",
        "}",
        /* Tornado Config Dialog */
        ".lite_dialog .lite_dialog_body .oauth_config label input[type=checkbox] + span {",
        "    color: #888;",
        "}",
        ".lite_dialog .lite_dialog_body .oauth_config label input[type=checkbox]:checked + span {",
        "    color: #000;",
        "}",
        /* Help Dialog */
        "#tornado_help_dialog {",
        "    height: 80%;",
        "    min-width: 700px;",
        "}",
        "#tornado_help_dialog .lite_dialog_body {",
        "    border-width: 1",
        "    width: 100%;",
        "    margin: 2px;",
        "    padding: 15px;",
        "    position: absolute;",
        "    left: 0;",
        "    right: 0;",
        "    top: 26px;",
        "    bottom: 0;",
        "    overflow: auto;",
        "}",
        "#tornado_help_dialog .tornado_help_list {",
        "    width: 100%;",
        "}",
        "#tornado_help_dialog .tornado_help_list th {",
        "    padding-top: 5px;",
        "}",
        "#tornado_help_dialog .tornado_help_list td {",
        "    padding: 1px;",
        "    border-width: 1px;",
        "}",
        "#tornado_help_dialog .tornado_help_list td p,",
        "#tornado_help_dialog .tornado_help_list td ul {",
        "    margin: 0;",
        "}",
        "#tornado_help_dialog .tornado_help_list .tornado_short_key {",
        "    font-family: monospace;",
        "}",
        "#tornado_help_dialog .tornado_help_list .tornado_short_desc .tornado_help_options {",
        "    margin: 0;",
        "    padding: 0;",
        "    color: #888;",
        "}",
        "#tornado_help_dialog .tornado_help_list .tornado_short_desc .tornado_help_options {",
        "    width: 200px;",
        "    list-style: none;",
        "    float: right;",
        "}",
    ].join('\n');

    /* Right column Information */
    Tornado.css += [
        /* Right column Help */
        "#tornado_rightcolumn_help {",
        // "  background-color: #344f68;",
        "  margin: 3px;",
        "  padding: 5px;",
        "  box-shadow: 0 0 3px inset;",
        "  border-radius: 3px;",
        "}",
        "#tornado_rightcolumn_help > p {",
        "  margin: 0;",
        "}",
        "#tornado_rightcolumn_help > p .show_tornado_config {",
        "  font-size: 12px;",
        "  color: #89BCF0;",
        "  cursor: pointer;",
        "}",
        "#tornado_rightcolumn_help > p .show_tornado_help {",
        "  font-size: 12px;",
        "  color: #89BCF0;",
        "  cursor: pointer;",
        "}",
        "#tornado_rightcolumn_help > ul {",
        "  margin: 0;",
        "  padding: 0;",
        "  list-style: none;",
        "}",
        "#tornado_rightcolumn_help > ul li:nth-of-type(4n) {",
        "  margin-bottom: 5px;",
        "}",
        "#tornado_shortcuts_help {",
        "  color: #abb;",
        "  font-size: 12px;",
        "  line-height: 1.2em;",
        "}",
        "#tornado_shortcuts_help dd {",
        "  width: 203px;",
        "  overflow: hidden;",
        "}",
        "#tornado_shortcuts_help .more {",
        "  font-size: 8px;",
        "  cursor: pointer;",
        "}",
        "#tornado_shortcuts_help .hide {",
        "  display: none;",
        "}",
        "#tornado_shortcuts_help dt + dd code {",
        "  border-radius: 3px 0 0 0;",
        "}",
        "#tornado_shortcuts_help dd:last-child code {",
        "  border-radius: 0 0 0 3px;",
        "}",
        "#tornado_shortcuts_help dd {",
        "  margin-left: 1em;",
        "  height: 1.2em;",
        "}",
        "#tornado_shortcuts_help code {",
        "}",
        "#tornado_shortcuts_help code:after {",
        "  content: ': ';",
        "}",
        /* Clean Posts */
        ".empty_post {",
        "  background: #fff;",
        "  border-radius: 10px;",
        "  margin-top: 20px;",
        "}",
        ".empty_post.same_user_as_last {",
        "  margin-top: 7px;",
        "}",
    ].join('\n');

    /* console が存在しない環境でもエラーで止まらないようにします */
    if (typeof console == 'undefined') {
        console = {log: function(){}};
    }

    /**
     * Tornado で使用できる左クリックイベントです。
     * Element.dispatchEvent(Tornado.left_click) として使います。
     */
    Tornado.left_click = document.createEvent('MouseEvent');
    Tornado.left_click.initEvent('click', true, true);

    /**
     * オブジェクトをシリアライズします
     * http://blog.stchur.com/2007/04/06/serializing-objects-in-javascript/
     * @param {Object} _obj 辞書型のオブジェクト.
     * @return {String} eval で復元できるシリアライズした文字列を返します.
     */
    Etc.serialize = function(_obj) {
       // Let Gecko browsers do this the easy way
       if (Tornado.browser != 'chrome' && typeof _obj.toSource !== 'undefined' && typeof _obj.callee === 'undefined')
       {
          return _obj.toSource();
       }
       // Other browsers must do it the hard way
       switch (typeof _obj)
       {
          // numbers, booleans, and functions are trivial:
          // just return the object itself since its default .toString()
          // gives us exactly what we want
          case 'number':
          case 'boolean':
          case 'function':
             return _obj;
             break;

          // for JSON format, strings need to be wrapped in quotes
          case 'string':
             return '\'' + _obj.replace("'", "\'") + '\'';
             break;

          case 'object':
             if (_obj instanceof RegExp) {
                /* RegExp return /regexp/ */
                return _obj.toString();
             }

             var str;
             if (_obj.constructor === Array || typeof _obj.callee !== 'undefined')
             {
                str = '[';
                var i, len = _obj.length;
                for (i = 0; i < len - 1; i++) { str += Etc.serialize(_obj[i]) + ','; }
                str += Etc.serialize(_obj[i]) + ']';
             }
             else
             {
                str = '{';
                var key;
                for (key in _obj) { str += key + ':' + Etc.serialize(_obj[key]) + ','; }
                str = str.replace(/\,$/, '') + '}';
             }
             return str;
             break;

          default:
             return 'UNKNOWN';
             break;
       }
    };

    /**
     * Reblog 時 XHR のヘッダに埋め込む Content Type を指定する用の配列です
     */
    var HeaderContentType = ["Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"];
    
    /**
     * 配列同士を比較します 
     * @param {Array} another this と比較する配列
     * @returns {Bool} 同一なら true を、値が一つでも違えば false を返します
     */
    Array.prototype.cmp = function(another) {
        return ((this.length != another.length)
            ? false
            : this.every(
                function(v, k) { return v == another[k]; }
              ));
    };

    /**
     * KeyEventCache
     */
    Etc.KeyEventCache = {
        cache: [],
        cache_length: 3,
        expire_time: 2000,
        last_time: 0,
        clear: function() {
            this.cache.length = 0;
        },
        add: function(e) {
            var ch,
                key_with = "",
                key;

            if (112 <= e.keyCode && e.keyCode <= 123) {
                return; /* Function keys */
            }
            else if (!(65 <= e.keyCode && e.keyCode <= 90) &&
                     !(48 <= e.keyCode && e.keyCode <= 57)) {
                return; /* None Alphabet and Number */
            }

            /* 入力エリア、またはリッチテキスト内では無効にします */
            if (e.target.tagName   === 'INPUT' ||
                e.target.tagName   === 'TEXTAREA' ||
                e.target.className === 'mceContentBody') {
                return;
            }

            ch = String.fromCharCode(e.keyCode);
            if (e.shiftKey) {
                key_with += "s";
            }
            if (e.ctrlKey) {
                key_with += "c";
            }
            if (e.altKey) {
                key_with += "a";
            }

            key = "";
            if (key_with.length) {
                key = key_with + '-';
            }
            key += ch.toLowerCase();

            if (this.last_time + this.expire_time < new Date()) {
                this.cache.length = 0;
            }
            this.last_time = (new Date() * 1);

            this.cache.push(key);
            this.cache = this.cache.slice(-this.cache_length);
        },
    };

    /**
     * ShareValue
     */
    Etc.ShareValue = {
        buildId: function(name) {
            return 'tornado_share_value_' + name;
        },
        addElement: function(name, value) {
            var id = this.buildId(name);

            var elm = (window.Etc || window).buildElement('inpug', {
                    type: 'hidden',
                    id: id,
                    value: value});

            return document.querySelectorAll('#tornado_rightcolumn_help')[0].appendChild(elm);
        },
        set: function(name, value) {
            var id = this.buildId(name);
            var elm = document.querySelectorAll('#' + id)[0];

            if (elm === undefined) {
                elm = this.addElement(name, value);
            }

            elm.setAttribute('value', value);
        },
        get: function(name, default_value) {
            var id = this.buildId(name);
            var elm = document.querySelectorAll('#' + id)[0];

            if (elm === undefined) {
                elm = this.addElement(name, default_value);
            }

            return elm.getAttribute('value');
        },
        toggle: function(name, default_value) {
            var id = this.buildId(name);
            var elm = document.querySelectorAll('#' + id)[0];
            var value;

            if (elm === undefined) {
                elm = this.addElement(name, default_value);
            }
            else {
                value = elm.getAttribute('value');
                elm.setAttribute('value', value == 'false');
            }

            return elm.getAttribute('value');
        },
    };

    /**
     * ビデオの開閉トグル関数です。
     * Tumblr application.js を元に Tumblr Tornado でも動くように移植しました
     * @param {Node} post 対象のビデオポスト要素
     */
    Etc.toggleVideoEmbed =  function toggleVideoEmbed(post) {
        var post_id = post.id.match(/\d+/)[0],
            toggle = post.querySelector('.video_thumbnail'),
            embed = post.querySelector('.video_embed'),
            watch = post.querySelector('.video');
        if (watch.style.display == 'none') {
            embed.innerHTML = post.querySelector('input[id^="video_"]').value;
            toggle.style.display = 'none';
            watch.style.display = 'block';
        }
        else {
            embed.innerHTML = '';
            toggle.style.display = 'block';
            watch.style.display = 'none';
        }
    };
    
    /**
     * HTML 文字列から Node 群を返します
     * @param {String} html 作成した HTML 文字列.
     * @return {Object} HTML を元に作成した要素を持つ DocumentFragment.
     */
    Etc.buildElementBySource = function buildElementBySource(html) {
        var range = document.createRange();
        range.selectNodeContents(document.body);
        return range.createContextualFragment(html);
    };
    
    /**
     * Node を作成し各種データを同時にセットします
     * @param {String} tag_name タグ名.
     * @param {Object} propaties 辞書型のデータ.
     * @param {String} HTML 文字列.
     * @return {Object} 作成した Node を返します.
     */
    Etc.buildElement = function buildElement(tag_name, propaties, innerHTML) {
        var elm = document.createElement(tag_name);
    
        for (var key in (propaties || {})) {
            elm.setAttribute(key, propaties[key]);
        }
    
        elm.innerHTML = innerHTML || '';
        return elm;
    };
    
    /**
     * document.querySelectorAll へのショートハンド
     * @param {String} selector CSS Selector
     * @return {Array} NodeList の Array に変換したもの
     */
    var $$ = Etc.$$ = function $$(selector) {
        /* || [] を用いるのは、querySelector は要素を見つけられなかった際に null を返します */
        return Array.prototype.slice.call(document.querySelectorAll(selector) || []); 
    };
    
    /**
     * クライアント領域で Script を実行します
     * @param {String} code 実行したいコード
     */
    Etc.execScript = function execScript(code) {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.innerHTML = code;
        script.addEventListener('onload', function(e) {
            (function letit(elm) {
                elm.parentNode.removeChild(elm);
            })(e.target);
        });
        document.body.appendChild(script);
    };
    
    /**
     * クライアントエリアのスクロール位置、画面サイズを取得します
     * @return {Object} left, top, width, height を備えた辞書を返します
     */
    Etc.viewportRect = function viewportRect() {
        return {
            left: document.documentElement.scrollLeft || document.body.scrollLeft,
            top: document.documentElement.scrollTop || document.body.scrollTop,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight};
    };
    
    /**
     * 要素の位置、サイズを取得します
     * @TODO absolute, fixed な要素の子要素などは再帰的に親へ辿る必要があります
     * @return {Object} 要素の left, top, width, height を備えた辞書を返します
     */
    Etc.nodeRect = function nodeRect (elm) {
        return {
            left: elm.offsetLeft,
            top: elm.offsetTop,
            width: elm.offsetWidth,
            height: elm.offsetHeight};
    };

    Etc.CustomKey = function(options) {
        this.url          = options.url;
        this.expr         = (options.expr && typeof options.expr === 'function') || function() {return true;};
        this.title        = options.title || func.name || func;
        this.group        = options.group || 0;
        this.grouporder   = options.grouporder;
        this.has_selector = options.has_selector || null;
        this.url          = options.url || null;
        this.usehelp      = (typeof options.usehelp == 'undefined') ? true : options.usehelp;
        this.desc         = options.desc || '';

        this.key_bind     = options.key_bind;
        this.func         = options.func;
    };

    Etc.CustomKey.prototype = {
        urlTest: function() {
            return true; /* TODO */
            if (this.url !== null &&
                this.url.test(location) === false) {
                return false;
            }
        },
        keyTest: function(key_event_cache) {
            var cache = key_event_cache.cache;
            if (cache.slice(-(this.key_bind.length)).cmp(this.key_bind)) {
                return true;
            }
            return false;
        },
        hasSelectorTest: function(post) {
            if (this.has_selector === null) {
                return true;
            }
            if (post && post.querySelector(this.has_selector)) {
                return true;
            }
            return false;
        },
        exprTest: function(post) {
            if (typeof this.expr === 'function') {
                return this.expr(post);
            }
            return true;
        },
    };
    
    /**
     * キーイベント用の辞書を生成して返します
     * @TODO needpost オプションを設定
     * @TODO class 化する
     * @param {String} match 最後に発火させる時のキー文字
     * @param {String}   func Tornado.commands の関数名
     * @param {Function} func 実行させたい関数
     * @param {Object} options 各種オプション
     * @returns {Object} キーイベント用の辞書型を返します
     */
    function customkey(match, func, options) {
        if (typeof options == 'undefined') {
            options = {};
        }
        return {
            match: match,
            func: func,
            expr: (options.expr && typeof options.expr === 'function') || function() {return true;},
            title: options.title || func.name || func,
            group: options.group || 0,
            grouporder: options.grouporder,
            follows: options.follows || [],
            has_selector: options.has_selector || '',
            url: options.url || null,
            shift: options.shift || false,
            ctrl: options.ctrl || false,
            alt: options.alt || false,
            usehelp: (typeof options.usehelp == 'undefined') ? true : options.usehelp,
            desc: options.desc || ''};
    }
    
    /**
     * ショートカットの一行ヘルプを作成して返します
     * @param {Object} shortcut customkey で作成したオブジェクト
     * @returns HTML 文字列を返します
     */
    Etc.buildShortcutLineHelp = function buildShortcutLineHelp(shortcut) {
        var pre_spacing = ['&nbsp;', '&nbsp;', '&nbsp;'],
            key = [];
    
        key.push((shortcut.follows && shortcut.follows.join(' ')) || '');
        key.push((shortcut.shift && 's-') || '');
        key.push(shortcut.match.toUpperCase());
    
        key = key.join('');
        key = pre_spacing.slice(key.length).join('') + key;
    
        return [
            '<code>',
            key,
            '</code>',
            (shortcut.title || shortcut.desc || shortcut.func.name)].join('');
    };
    
    /**
     * 特定の関数は this があるオブジェクトを指している事を想定しています。
     * そのような関数を呼び出す際に self を指定すると func の this が self になったまま呼び出されます。
     * 使用目的として EventListener や setTimeout を想定しています。
     * @param {Object}   self func を呼び出した際 this にしたい変数
     * @param {Function} func 実行したい関数
     * @param {args}     デフォルトの引数
     * @returns 上記の目的を満たすクロージャ
     */
    Etc.preapply = function preapply(self, func, args) {
        return function() {
            func.apply(self, (args || []).concat(Array.prototype.slice.call(arguments)));
        };
    };
    
    /**
     * 辞書型オブジェクトをクエリ文字列に変換します
     * @param {Object} dict 辞書型オブジェクト
     * @return {String} クエリ文字列
     */
    Etc.buildQueryString = function buildQueryString(dict) {
        if (typeof dict == 'undefined') {
            return '';
        }
        var queries = [];
        for (var key in dict) {
            queries.push([encodeURIComponent(key),
                          encodeURIComponent(dict[key])].join('='));
        }
        return queries.join('&');
    };
    
    /**
     * prototype.js 風な Ajax 関数
     * @param {String} url URL.
     * @param {Object} options 各オプションを持った辞書型オブジェクト.
     * @todo Ajax.Request では parameters は文字列ではなく辞書型オブジェクトで入ってくるかどうか
     */
    function Ajax(url, options) {
        var xhr = this.xhr = new XMLHttpRequest(),
            async = (options.asynchronous === undefined) || options.asynchronous;
    
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var status = parseInt(xhr.status);
                if ((status / 100) == 2) {
                    if (options.onSuccess) {
                        options.onSuccess(xhr);
                    }
                }
                else if ((status / 100) >= 4) {
                    if (options.onFailure) {
                        options.onFailure(xhr);
                    }
                }
                if (options.onComplete) {
                    options.onComplete(xhr);
                }
            }
        }

        if (options.parameters && (typeof options.parameters != 'string')) {
            options.parameters = Etc.buildQueryString(options.parameters);
        }
    
        if (options.method == undefined && options.parameters) {
            options.method = 'POST';
        }
        else if (options.method == undefined) {
            options.method = 'GET';
        }
    
        /* FIXME: PUT や DELETE にも対応 */
        if ('POST' != options.method.toUpperCase() && options.parameters) {
            url = [url, options.parameters].join('?');
            options.parameters = null;
        }
        else {
            if (options.requestHeaders == undefined ||
                options.requestHeaders.indexOf('Content-Type') < 0 ||
                options.requestHeaders.indexOf('Content-type') < 0 ||
                options.requestHeaders.indexOf('content-type') < 0) {
                options.requestHeaders = (options.requestHeaders || []).concat(HeaderContentType);
                // FIXME: ここ Content-Type 設定してても入っちゃいます
            }
        }
    
        xhr.open(options.method, url, async);
        for (var i = 0; options.requestHeaders && i < options.requestHeaders.length; i += 2) {
            xhr.setRequestHeader(options.requestHeaders[i], options.requestHeaders[i + 1]);
        }
        xhr.send(options.parameters);
    }
    
    /**
     * クライアントエリアの右下にピンバルーンメッセージを表示します
     */
    function PinNotification (message) {
        var board = document.querySelector('#pin_notification_board');
        if (!board) {
            board = document.body.appendChild(document.createElement('div'));
            board.id = 'pin_notification_board';
        }
    
        var elm = board.appendChild(document.createElement('div'));
        elm.className = 'pin_notification';
        elm.appendChild(document.createTextNode(message));
    
        setTimeout(function() { board.removeChild(elm); }, 3000);
    }

    /**
     * Object(dst) の名と値を Object(dict) へ更新します
     */    
    Etc.dictUpdate = function dictUpdate(dict, dst) {
        /* TODO: あとで外に出します */
        var name;
        for (name in (dst || {})) {
            dict[name] = dst[name];
        }
    };

    /**
     * form の有効な値を集めます
     */
    Etc.gatherFormValues = function gatherFormValues(form) {
        var values = {},
            items = form.querySelectorAll('input, textarea, select');
        Array.prototype.slice.call(items).filter(function(elm) {
            return (['checkbox', 'radio'].indexOf(elm.type) >= 0)
                ? elm.checked
                : !elm.disabled;
        }).map(function(elm){
            values[elm.name] = elm.value;
        });
        return values;
    };
    
    /**
     * 軽量なダイアログボックスを表示します
     * @class
     * @name LiteDialog
     * @param {String} title タイトル
     */
    function LiteDialog(title) {
        /* ダイアログを移動する際にダイアログ左上からマウスまでの位置の差です */
        this.origin_offsetX = this.origin_offsetY = null;
    
        var dialog = this.dialog = document.createElement('div');
        dialog.object = dialog;
        dialog.className = 'lite_dialog';
        dialog.innerHTML = this.base_lite_dialog;
    
        var caption = dialog.querySelector('.lite_dialog_caption');
        caption.appendChild(document.createTextNode(title));
        caption.addEventListener('mousedown', Etc.preapply(this, this.mousedown));
    
        var close = dialog.querySelector('.lite_dialog_close');
        close.addEventListener('click', Etc.preapply(this, this.close));
    
        document.body.appendChild(dialog);
        this.centering();
    
        document.addEventListener('keydown', LiteDialog.prototype.keyevent, true);
    }
    
    LiteDialog.prototype = /** @lends LiteDialog.prototype */ {
        /**
         * lite_dialog のベース HTML
         * @TODO skelton
         */
        base_lite_dialog: [
            '<div class="lite_dialog_sysbar">',
            '  <div class="lite_dialog_sysmenus">',
            '    <span class="lite_dialog_close">× </span>',
            '  </div>',
            '  <div class="lite_dialog_caption">',
            '  </div>',
            '</div>',
            '<div classdiv class="lite_dialog_body">',
            '</div>'].join('')
        ,
        /**
         * LiteDialog のタイトルが掴まれた時の処理
         * @param {Object} e event
         */
        mousedown: function(e) {
            this.mousemove = Etc.preapply(this, this.mousemove);
            this.mouseup = Etc.preapply(this, this.mouseup);
      
            document.addEventListener('mousemove', this.mousemove);
            document.addEventListener('mouseup', this.mouseup);
      
            this.origin_offsetX = e.clientX - this.dialog.offsetLeft;
            this.origin_offsetY = e.clientY - this.dialog.offsetTop;
        },
        /**
         * LiteDialog を移動している最中の処理
         * @param {Object} e event
         */
        mousemove: function(e) {
            this.dialog.style.top = (e.clientY - this.origin_offsetY) + 'px';
            this.dialog.style.left = (e.clientX - this.origin_offsetX) + 'px';
            window.getSelection().removeAllRanges();
        },
        /**
         * LiteDialog の移動終了の処理
         * @param {Object} e event
         */
        mouseup: function(e) {
            document.removeEventListener('mousemove', this.mousemove);
            document.removeEventListener('mousemove', this.mouseup);
        },
        /**
         * LiteDialog を閉じる処理
         * @param {Object} e event
         */
        close: function(e) {
            this.dialog.parentNode.removeChild(this.dialog);
            this.dialog = undefined;
        },
        /**
         * LiteDialog 用のキーイベント
         * 同じイベントは何度登録しても重複(何度も)処理されません
         * @param {Object} e event
         */
        keyevent: function (e) {
            /* 数字キーが入力された際に対応したチャンネルのボタンをクリックします */
            if (document.querySelector('.lite_dialog')) {
                if (e.keyCode == 27) {
                    document.querySelector('.lite_dialog_close').dispatchEvent(Tornado.left_click);
                }
                else if (48 <= e.keyCode && e.keyCode <= 57) {
                    /* TODO: これは Lite Dialog が持つべき機能ではありません */
                    /* 48 == '0', 57 == '9' */
                    var number = parseInt(e.keyCode) - '0'.charCodeAt(0);
                    var name = 'button' + number;
                    document.querySelector('.lite_dialog input[type="button"].' + name).click();
                }
            }
        },
        /**
         * LiteDialog を画面中央に置きます
         */
        centering: function() {
            var elm = this.dialog,
                vr = Etc.viewportRect();
            elm.style.top = (vr.top + (vr.height / 2) - (elm.offsetHeight / 2)) + 'px';
            elm.style.left = (vr.left + (vr.width / 2) - (elm.offsetWidth / 2)) + 'px';
        },
        /**
         * LiteDialog 内容物の大きさにサイズを合わせます
         */
        resize: function() {
        },
    };

    
    /**
     * Tornado のメイン機能部
     * @namespace
     */
    Tornado.buildCustomTweet = function buildCustomTweet(postdata) {
        function truncate(text, length, trunc) {
            if (text.length > length) {
                text = text.slice(0, length - trunc.length) + trunc;
            }
            return text;
        }
        function textIntoHTMLLike(html) {
            var text;
            var elm = document.createElement('div');
            elm.innerHTML = html;

            if (elm.textContent) {
                text = elm.textContent;
            }
            else if (elm.innerText) {
                text = elm.innerText;
            }
            else {
                text = "";
            }

            text = text.replace(/<[^>]+>/g, '');
            return text.replace(/( |\r|\n)+/g, ' ').replace(/(^ +| +$)/g, '');
        }

        var type;
        var prefix_list;
        var prefix, body, suffix;
        var length;

        var one, two, three;
        one = textIntoHTMLLike(postdata['post[one]']);
        two = textIntoHTMLLike(postdata['post[two]']);
        three = textIntoHTMLLike(postdata['post[three]']);

        type = postdata['post[type]'];
        length = 140 - 30;
        prefix = '';
        body = '';
        suffix = ' [URL]';

        prefix_list = {
            regular: '',
            quote: '',
            link: '',
            note: '', /* whether */
            answer: '', /* whether */
            photo: 'Photo: ',
            conversation: 'Overheard: ',
            audio: 'Audio: ',
            video: 'Video: '
        };
        prefix = prefix_list[type];
            
        switch (type) {
            case 'regular':
            case 'conversation':
                if (one && two) {
                    body = [one, two].join(' - ');
                }
                else if (one) {
                    body = one;
                }
                else {
                    body = two;
                }
                break;
            case 'photo':
            case 'video':
            case 'audio':
                body = two;
                break;
            case 'note':
                // what is note?
                body = one;
                break;
            case 'link':
                if (one && three) {
                    body = [one, three].join(' - ');
                }
                else if (one) {
                    body = one;
                }
                else if (three) {
                    body = three;
                }
                else {
                    body = two.match(/https?:\/\/([^\/]+)/)[1];
                }
                break;
            case 'quote':
                body = [
                    "\u201c",
                    truncate(one, length - 5, '\u2026'),
                    "\u201d"
                ].join('');
                if (one.length <= (length - 5) &&
                    two &&
                    body.length < (length - 5)) {
                    body += " - " + two;
                }
                break;
            default:
                break;
        }

        if (!body.length) {
            suffix = suffix.replace(/(^ +| +$)/g, '');
        }

        return prefix + truncate(body, length, '\u2026') + suffix;
    };

    /**
      * 入力されたキーによってコマンドを実行します
      * @param {Object} e Eventオブジェクト
      */
    Tornado.keyevent = function keyevent(e) {
        var post,
            margin_top = 7,
            vr = Etc.viewportRect();

        Etc.KeyEventCache.add(e);

        post = $$('#posts>.post:not(.new_post)').filter(function(elm) {
            return Math.abs(vr.top - (elm.offsetTop - margin_top)) < 5;
        })[0];
        if (!post) {
            console.info('Post not found');
        }

        Tornado.newshortcuts.some(function(shortcut) {
            /*
             優先順位
             1. URL マッチ
             2, 所有セレクタ
             3, 前項入力キー
             4. Ctrl, Alt, Shift 組み合わせキー
            */
            if (!shortcut.urlTest()) {
                return false;
            }
            if (!shortcut.hasSelectorTest(post)) {
                return false;
            }
            if (!shortcut.exprTest(post)) {
                return false;
            }
            if (!shortcut.keyTest(Etc.KeyEventCache)) {
                return false;
            }

            shortcut.func(post, e);
            Etc.KeyEventCache.clear();
            return true;

            if (!(shortcut.follows.cmp(Tornado.vals.key_follows.slice(-shortcut.follows.length + 1).slice(0, -1)) &&
                      (typeof shortcut.match == 'string' ? ((shortcut.shift ? shortcut.match.toUpperCase()
                                                                            : shortcut.match.toLowerCase()) == Tornado.vals.key_follows.slice(-1)[0])
                                                         : shortcut.match.indexOf(Tornado.vals.key_follows.slice(-1)[0]) >= 0))) {
                return false;
            }
    
            shortcut.func(post, e);
            Tornado.vals.key_follows = [];
            return true;
        });
        return;

        var post,
            margin_top = 7,  /* post 上部に 7px の余白が設けられます */
            vr = Etc.viewportRect(),
            ch = String.fromCharCode(e.keyCode);
    
        ch = (e.shiftKey ? ch.toUpperCase() : ch.toLowerCase());
    
        if (112 <= e.keyCode && e.keyCode <= 123) {
            return; /* Function keys */
        }
        else if (!(65 <= e.keyCode && e.keyCode <= 90) && !(48 <= e.keyCode && e.keyCode <= 57)) {
            return; /* Not Alphabet and Number */
        }
    
        /* 入力エリア、またはリッチテキストでは無効にします */
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.className === 'mceContentBody') {
            return;
        }
    
        /* 連続キーバインド用 */
        if (Tornado.vals.key_input_time + Tornado.vals.KEY_CONTINUAL_TIME < new Date()) {
            Tornado.vals.key_follows = [];
        }
        Tornado.vals.key_input_time = new Date() * 1;
        Tornado.vals.key_follows = Tornado.vals.key_follows.concat(ch).slice(-Tornado.vals.KEY_MAX_FOLLOWS);
    
        post = $$('#posts>.post:not(.new_post)').filter(function(elm) {
            return Math.abs(vr.top - (elm.offsetTop - margin_top)) < 5;
        })[0];
        if (!post) {
            console.info('Post not found');
        }
    
        Tornado.shortcuts.some(function(shortcut) {
            /*
             優先順位
             1. URL マッチ
             2, 所有セレクタ
             3, 前項入力キー
             4. Ctrl, Alt, Shift 組み合わせキー
            */
            if (shortcut.url !== null &&
                shortcut.url.test(location) === false) {
                return false;
            }
            else if (e.shiftKey != shortcut.shift ||
                     e.ctrlKey  != shortcut.ctrl ||
                     e.altKey   != shortcut.alt) {
                return false;
            }
            else if (shortcut.has_selector &&
                     post &&
                     post.querySelector(shortcut.has_selector) === null) {
                return false;
            }
            else if (!(shortcut.follows.cmp(Tornado.vals.key_follows.slice(-shortcut.follows.length + 1).slice(0, -1)) &&
                      (typeof shortcut.match == 'string' ? ((shortcut.shift ? shortcut.match.toUpperCase()
                                                                            : shortcut.match.toLowerCase()) == Tornado.vals.key_follows.slice(-1)[0])
                                                         : shortcut.match.indexOf(Tornado.vals.key_follows.slice(-1)[0]) >= 0))) {
                return false;
            }
    
            shortcut.func(post, e);
            Tornado.vals.key_follows = [];
            return true;
        });
    };

    Tornado.funcs = {
        /**
         * reblog を実行します。
         * @param {Node} post 対象の li.post
         * @param {Object} default_postdata 送信するポストデータ
         * @todo classList.add, remove を使ってみる
         */
        reblog: function reblog(post, default_postdata) {
            Tornado.funcs.shutterEffect(post);
        
            var reblog_button = post.querySelector('a.reblog_button');
            reblog_button.className += ' loading';

            var reblog_id, reblog_key, form_key;
            reblog_id = reblog_button.getAttribute('data-reblog-id');
            reblog_key = reblog_button.getAttribute('data-reblog-key');
            form_key = reblog_button.getAttribute('data-user-form-key');

            var parameters = JSON.stringify({
                reblog_id: reblog_id,
                reblog_key: reblog_key,
                form_key: form_key,
                post_type: false
            });

            if (Tornado.browser != 'opera') {
                new Ajax('http://www.tumblr.com/svc/post/fetch', {
                    method: 'post',
                    parameters: parameters,
                    onSuccess: function(_xhr) {
                        var name;
                        var response_json = JSON.parse(_xhr.response);
    
                        var postdata = {
                            channel_id: undefined,
                            form_key: form_key,
                            reblog_key: reblog_key,
                            reblog_id: parseInt(reblog_id),
                            reblog_post_id: reblog_id,
                            detached: true,
                            reblog: true,
                            silent: true,
                            context_id: "",
                            // "is_rich_text[one]": "0",
                            // "is_rich_text[two]": "0",
                            // "is_rich_text[three]": "0",
                            pre_upload: "",
                            preuploaded_url: "",
                            preuploaded_ch: "",
                            "post[date]": "",
                            "post[publish_on]": "",
                            "post[state]": "0",
                            "post[photoset_order]": "o1",
                            valid_embed_code: "1",
                            remove_album_art: "",
                            album_art: "",
                            MAX_FILE_SIZE: "10485760",
                            custom_tweet: "[URL]",
                        };
                        Etc.dictUpdate(postdata, response_json);
    
                        for (name in postdata['post']) {
                            postdata['post[' + name + ']'] = postdata['post'][name];
                        }
                        delete postdata['post'];
    
                        for (name in postdata['post[id3_tags]']) {
                            postdata['id3_tags[' + name.toLowerCase() + ']'] = postdata['post[id3_tags]'][name];
                        }
                        delete postdata['post[id3_tags]'];

                        Etc.dictUpdate(postdata, default_postdata);

                        try {
                            if (Tornado.tumblelog_configs[postdata['channel_id']]['data-twitter-on'] == "true") {
                                postdata['send_to_twitter'] = 'on';
                                postdata['custom_tweet'] = Tornado.buildCustomTweet(postdata);
                            }
                        } catch (e) { }
    
                        new Ajax('http://www.tumblr.com/svc/post/update', {
                            method: 'post',
                            parameters: JSON.stringify(postdata),
                            requestHeaders: ['Content-Type', 'application/json'],
                            onSuccess: function(_xhr) {
                                var dp, json;

                                reblog_button.className = reblog_button.className.replace(/\bloading\b/, 'reblogged');

                                json = JSON.parse(_xhr.responseText);

                                if (json.errors) {
                                    if (typeof json.errors == 'string') {
                                        alert(json.errors);
                                    }
                                    else if (json.errors.length) {
                                        alert(json.errors[0]);
                                    }
                                    else {
                                        console.log(json.errors);
                                        alert(json.errors);
                                    }
                                }
                                else {
                                    var dp = default_postdata;
                                    new PinNotification([
                                        'Success: Reblogged',
                                        (dp['post[state]'] && Tornado.vals.state_texts[dp['post[state]']]) || '',
                                        (dp['channel_id'] && dp['channel_id'] != '0' && dp['channel_id']) || ''].join(' '));
                                }
                            },
                        });
                    },
                });
            }
            else if (Tornado.browser == 'opera') {
                /* FIXME: 正しく動きません */
                new Ajax(reblog_button.href, {
                    method: 'GET',
                    onSuccess: function(_xhr) {
                        var dummy_elm = Etc.buildElementBySource(_xhr.responseText);
            
                        /* 有効な form データを集めます */
                        var form = dummy_elm.querySelector('#content > form');
                        var postdata = Etc.gatherFormValues(form);
                        delete postdata['preview_post'];
                        for (var name in (default_postdata || {})) {
                            postdata[name] = default_postdata[name];
                        }
            
                        new Ajax(form.action, {
                            method: form.method,
                            parameters: Etc.buildQueryString(postdata),
                            requestHeaders: HeaderContentType,
                            onSuccess: function(_xhr) {
                                var response_elm = Etc.buildElementBySource(_xhr.responseText);
            
                                if (response_elm.querySelector('ul#errors')) {
                                    reblog_button.className = reblog_button.className.replace('loading', '');
                                    alert(response_elm.querySelector('ul#errors').textContent.trim());
                                }
                                else {
                                    reblog_button.className = reblog_button.className.replace(/\bloading\b/, 'reblogged');
            
                                    var dp = default_postdata;
                                    new PinNotification([
                                        'Success: Reblogged',
                                        (dp['post[state]'] && Tornado.vals.state_texts[dp['post[state]']]) || '',
                                        (dp['channel_id'] && dp['channel_id'] != '0' && dp['channel_id']) || ''].join(' '));
                                }
                            },
                        });
                    },
                });
            }
        },
        /**
            target_blog_info = {
                hostname: '',
                token: '',
                token_secret: ''
            }
         */
        apiReblog: function reblogAPI(post, state, target_blog_info) {
            var hostname = target_blog_info.hostname;
            var url = 'http://api.tumblr.com/v2/blog/' + (hostname) + '/post/reblog';
            var id, reblog_key;

            var accessor = {
                consumerKey    : Tornado.vals.CONSUMER_KEY,
                consumerSecret : Tornado.vals.CONSUMER_SECRET,
                token          : target_blog_info.token,
                tokenSecret    : target_blog_info.token_secret
            };

            var reblog_button = post.querySelector('a.reblog_button');
            var reblog_key = reblog_button.getAttribute('data-reblog-key'),
                reblog_id = reblog_button.getAttribute('data-reblog-id');
    
            var parameters = {
                state: state,
                id: reblog_id,
                reblog_key: reblog_key,
            };

            var message = {method: 'POST', action: url, parameters: parameters};
            var request_body = OAuth.formEncode(message.parameters);

            OAuth.completeRequest(message, accessor);

            function receiveRequestToken(xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 201) {
                        new PinNotification('Success: ' + (state || 'reblog') + ' to ' + hostname);
                    }
                    else {
                        var json = JSON.parse(xhr.responseText);
                        new PinNotification('Fails: ' + (state || 'reblog') + ' to ' + hostname + '\n' + json.meta.msg);
                    }
                    reblog_button.className = reblog_button.className.replace(/\bloading\b/, 'reblogged');
                }
            };
            var realm = "";
            var headers = {
                'Authorization':  OAuth.getAuthorizationHeader(realm, message.parameters),
                'Content-Type': "application/x-www-form-urlencoded"
            };

            Tornado.funcs.shutterEffect(post);
            reblog_button.className += ' loading';
        
            GM_xmlhttpRequest({
                url: message.action,
                method: message.method,
                headers: headers,
                data: request_body,
                onload: receiveRequestToken,
            });

            new PinNotification('Reblog ...');
        },
        channelDialog: function channelDialog(post, postdata) {

            if (Tornado.gm_api && JSON.parse(GM_getValue('oauthconfigs', '[]')).length) {
                var state_text = Tornado.vals.state_texts[postdata["post[state]"]] || '';
                var title = ['Reblog', (state_text) ? ('as ' + state_text) : ('') , 'to [channel]'].join(' ');

                var dialog = new LiteDialog(title);
                dialog.dialog.className += ' channel_dialog';

                var dialog_body = dialog.dialog.querySelector('.lite_dialog_body');

                var oauthconfigs = JSON.parse(GM_getValue('oauthconfigs', '[]'));
                var exclude_tumblelogs = JSON.parse(GM_getValue('exclude_tumblelogs', '{}'));
                var tumblelogs = [];

                var button_num = 0;
                oauthconfigs.map(function(oauth_config, id_num){
                    if (dialog_body.lastChild && dialog_body.lastChild.tagName.toUpperCase() != 'HR') {
                        dialog_body.appendChild(document.createElement('hr'));
                    }

                    var account_div = Etc.buildElement('div', {}, '<p>Account: <span style="font-weight: bold;">' + (oauth_config.id) + '</span></p>');

                    oauth_config.tumblelogs.map(function(tumblelog, tumblelog_num){
                        if (exclude_tumblelogs[oauth_config.id] != undefined &&
                            exclude_tumblelogs[oauth_config.id][tumblelog.hostname] == true) {
                            return;
                        }

                        button_num += 1;

                        var button = Etc.buildElement('input', {
                            type: 'button',
                            class: 'button' + (button_num),
                            name: 'button' + [id_num, tumblelog_num].join('_'),
                            value: '[' + (button_num) + ']: ' + tumblelog.name
                        });

                        button.addEventListener('click', function(e) {
                            var id_num, tumblelog_num;
                            var m = e.target.name.match(/button(\d+)_(\d+)/);

                            id_num = parseInt(m[1]);
                            tumblelog_num = parseInt(m[2]);

                            var  target_blog_info = {
                                hostname: oauthconfigs[id_num].tumblelogs[tumblelog_num].hostname,
                                token: oauthconfigs[id_num].token,
                                token_secret: oauthconfigs[id_num].token_secret,
                            };

                            Tornado.funcs.apiReblog(post, state_text, target_blog_info);
                            dialog.close();
                        });
                        account_div.appendChild(button);
                    });

                    if (account_div.children.length > 1) {
                        dialog_body.appendChild(account_div);
                    }
                });

                dialog.dialog.style.top = (post.offsetTop + 37) + 'px';
                dialog.dialog.style.left = (post.offsetLeft + 20) + 'px';
    
                dialog_body.querySelector('input[type="button"]').focus();
            }
            else {
                var state_text = Tornado.vals.state_texts[postdata["post[state]"]] || '';
                var title = ['Reblog', (state_text) ? ('as ' + state_text) : ('') , 'to [channel]'].join(' ');
    
                var dialog = new LiteDialog(title);
                dialog.dialog.className += ' channel_dialog';
    
                var dialog_body = dialog.dialog.querySelector('.lite_dialog_body');
        
                $$('#popover_blogs .popover_menu_item:not(#button_new_blog)').map(function(elm, i) {
                    var channel_id = elm.id.slice(9);
                    var button = Etc.buildElement('input', {
                            type: 'button',
                            class: 'button' + (i + 1),
                            name: channel_id,
                            value: ['[', i + 1, ']: ', elm.children[1].textContent.trim()].join('')});
                    button.addEventListener('click', function(e) {
                        postdata['channel_id'] = this.name;
                        Tornado.funcs.reblog(post, postdata);
                        dialog.close();
                    });
                    dialog_body.appendChild(button);
                });
        
                dialog.dialog.style.top = (post.offsetTop + 37) + 'px';
                dialog.dialog.style.left = (post.offsetLeft + 20) + 'px';
    
                dialog_body.querySelector('input[type="button"]').focus();
            }
        },
        /**
         * delete, publish, queue フォームを Ajax を用いて実行します
         * @param {Node} form delete, publish, queue フォーム要素
         * @param {Function} onSuccess 成功時に呼び出される関数
         * @param {Function} onFailure 失敗時に呼び出される関数
         * TODO: 必要かどうか見当
         */
        submitPublish: function(form, onSuccess, onFailure) {
            new Ajax(form.action, {
                method: form.method,
                requestHeaders: HeaderContentType,
                parameters: Etc.buildQueryString(Etc.gatherFormValues(form)),
                onSuccess: onSuccess,
                onFailure: onFailure});
        },
        shutterEffect: function shutterEffect(post) {
            post.classList.remove('shuttering');
            post.classList.add('shutter_base');
    
            var delay_shutter = 0;
            if (/Firefox/.test(navigator.userAgent) ||
                /Opera/.test(navigator.userAgent)) {
                delay_shutter = 50;
            }
    
            setTimeout(
                function() { post.classList.add('shuttering'); },
                delay_shutter);
         },
         i18n: function i18n(message) {
            if (typeof message == 'string') {
                return message;
            }

            return message[Tornado.lang] ||
                   message['en'] ||
                   message['ja'] ||
                   message;
        },
    };

    Tornado.customfuncs = {
        reblog: function reblog(post) {
            var channel_id = $$('#popover_blogs .popover_menu_item:not(#button_new_blog)')[0].id.slice(9);
            Tornado.funcs.reblog(post, {'post[state]': '0', 'channel_id': channel_id});
        },
        reblogToChannel: function reblogToChannel(post) {
            Tornado.funcs.channelDialog(post, {'post[state]': '0', 'channel_id': '0'});
        },
        directReblogToChannel: function directReblogToChannel(post, e) {
            var channel_num = parseInt(String.fromCharCode(e.keyCode)) - 1;
            var channel_id = $$('#popover_blogs .popover_menu_item:not(#button_new_blog)')[channel_num].id.slice(9);
            Tornado.funcs.reblog(post, {'post[state]': '0', 'channel_id': channel_id});
        },
        draft: function draft(post) {
            var channel_id = $$('#popover_blogs .popover_menu_item:not(#button_new_blog)')[0].id.slice(9);
            Tornado.funcs.reblog(post, {'post[state]': '1', 'channel_id': channel_id});
        },
        draftToChannel: function draftToChannel(post) {
            Tornado.funcs.channelDialog(post, {'post[state]': '1'});
        },
        queue: function queue(post) {
            var channel_id = $$('#popover_blogs .popover_menu_item:not(#button_new_blog)')[0].id.slice(9);
            Tornado.funcs.reblog(post, {'post[state]': '2', 'channel_id': channel_id});
        },
        queueToChannel: function queueToChannel(post) {
            Tornado.funcs.channelDialog(post, {'post[state]': '2'});
        },
        private: function _private(post) {
            var channel_id = $$('#popover_blogs .popover_menu_item:not(#button_new_blog)')[0].id.slice(9);
            Tornado.funcs.reblog(post, {'post[state]': 'private', 'channel_id': channel_id});
        },
        privateToChannel: function privateToChannel(post) {
            Tornado.funcs.channelDialog(post, {'post[state]': 'private'});
        },
        halfdown: function halfdown() {
            var view_height = window.innerHeight;
            window.scrollBy(0, +view_height / 2);
        },
        halfup: function halfup() {
            var view_height = window.innerHeight;
            window.scrollBy(0, -view_height / 2);
        },
        goTop: function goTop(post) {
            Tornado.vals.prev_cursor = post;
            window.scroll(0, 0);
        },
        goBottom: function goBottom(post) {
            Tornado.vals.prev_cursor = post;
            window.scroll(0, document.height || document.body.clientHeight);
        },
        jumpToLastCursor: function jumpToLastCursor() {
            var y = Tornado.vals.prev_cursor.offsetTop;
            Tornado.vals.prev_cursor = null;
            window.scroll(0, y - 7);
        },
        fast_reblog: function fastReblog(post) {
            var reblog_button = post.querySelector('a.reblog_button');
            var reblog_key = reblog_button.getAttribute('data-reblog-key'),
                reblog_id = reblog_button.getAttribute('data-reblog-id'),
                form_key = reblog_button.getAttribute('data-user-form-key');
    
            Tornado.funcs.shutterEffect(post);
            reblog_button.className += ' loading';
            new Ajax('/fast_reblog', {
                method: 'POST',
                parameters: Etc.buildQueryString({reblog_key: reblog_key, reblog_post_id: reblog_id, form_key: form_key}),
                onSuccess: function(_xhr) {
                    reblog_button.className = reblog_button.className.replace(/\bloading\b/, 'reblogged');
                    new PinNotification('Success: fast Reblogged');
                },
                onFailure: function(_xhr) {
                    alert('Error: ' + _xhr.responseText);
                    reblog_button.className = reblog_button.className.replace('loading', '')
                },
            });
        },
        notes: function notes(post) {
            var notes_link = post.querySelector('.reblog_count');
            notes_link.dispatchEvent(Tornado.left_click);
        },
        endlessSummer: function() {
            var name = 'endless_summer';
            var value = Etc.ShareValue.toggle(name, true);

            new PinNotification('Endless summer was turned ' + ({'true': 'On', 'false': 'Off'}[value]));
        },
        scaleImage: function scaleImage(post) {
            var reg_type = /\b(?:photo|regular|quote|link|conversation|audio|video)\b/;
            var type = post.className.match(reg_type)[0];
            if (type != "photo" && type != "video") {
                return;
            }
    
            if (type == "photo") {
                (function letit(elm){
                    // from Tumblr.like_post http://assets.tumblr.com/javascript/jquery.application_src.js
                    // This is excellent code to fix redrew bug of chrome.
                    post.className += " force_redraw";
                    post.offsetHeight;
                    post.className = post.className.replace(/\b force_redraw\b/, '');

                    elm.dispatchEvent(Tornado.left_click);
                })(post.querySelector('img.image_thumbnail') ||
                   document.querySelector('#tumblr_lightbox') ||
                   post.querySelector('a.photoset_photo'));
            }   
            else if (type == 'video') {
                Etc.toggleVideoEmbed(post);
            }   
        },
        cleanPosts: function cleanPosts(/* post */) {
            var vr = Etc.viewportRect(),
                i = 0;
    
            $$('#posts > li:not(.new_post)').filter(function(post) {
                return (post.offsetTop - 7) < vr.top;
            }).map(function(src_post) {
                var post = document.createElement('li');
                post.className = ['empty_post', src_post.className.match(/\bsame_user_as_last\b/)].join(' ');
                post.style.cssText = [
                    'width:', src_post.offsetWidth, 'px;',
                    'height:', src_post.offsetHeight, 'px;'].join('');
                src_post.parentNode.replaceChild(post, src_post);
                i++;
            });
    
            new PinNotification(i + '件のポストを空にしました。');
        },
        removePosts: function removePosts(/* posts */) {
            var dsbd = document.querySelector('#posts'),
                vr = Etc.viewportRect(),
                del_count = 0;
    
            $$('#posts > li:not(.new_post)').filter(function(post) {
                return (post.offsetTop - 7) < vr.top;
            }).map(function(post) {
                del_count++;
                dsbd.removeChild(post);
            });
    
            var firstpost = document.querySelector('#posts > li:not(.new_post)');
            firstpost.className = firstpost.className.replace('same_user_as_last', '');
    
            window.scrollTo(0, document.querySelector('#posts>.post:not(.new_post)').offsetTop - 7);
    
            new PinNotification(del_count + '件のポストを削除しました。');
        },
        removeBottomPosts: function removeBottomPosts(/* post */) {
            var dsbd = document.querySelector('#posts'),
                vr = Etc.viewportRect(),
                del_count = 0;
    
            Etc.execScript('next_page = null; loading_next_page = true;');
            document.body.style.marginBottom = '500px';
    
            $$('#posts > li:not(.new_post)').filter(function(post) {
                return (post.offsetTop - 7) > vr.top;
            }).map(function(post) {
                del_count++;
                dsbd.removeChild(post);
            });
    
            new PinNotification('現在より下のポストを' + del_count + '件のポストを削除しました。');
        },
        viewPostPageInBackground: function viewPostPageInBackground(post) {
            var permalink;
            if (permalink = post.querySelector('.permalink')) {
                window.open(permalink.href);
                window.focus();
            }
        },
        /**
         * @fixme "reblogged you:" の際には上手く動きません
         * @fixme private ポストでの取得には対応していません
         */
        rootInfo: function rootInfo(post) {
            var post_id = post.id.match(/\d+/)[0];
            var post_info = post.querySelector('.post_info');
            if (post_info.querySelector('.root_info')) {
                return;
            }
    
            var root_info = document.createElement('span');
            root_info.className = 'root_info';
            root_info.innerHTML = ' [...]';
            post_info.insertBefore(root_info, post_info.lastChild);
    
            var script = document.createElement('script');
            script.id = 'showroot_' + post_id;
    
            var permalink = post.querySelector('a.permalink').href;
            var blog_name = permalink.match(/[^\/]*(?=\/(?:post|private))/)[0];
            var qs = Etc.buildQueryString({id: post_id , jsonp: 'jsonpRootInfo', reblog_info: 'true', api_key: Tornado.vals.CONSUMER_KEY});
            var url = [
                'http://api.tumblr.com/v2/blog',
                blog_name,
                'posts?' + qs].join('/');
            script.src = url;
    
            document.body.appendChild(script);
        },
        topReload: function topReload() {
            var reg_top_path = /^http:\/\/www.tumblr.com\/(?:dashboard|likes|(?:blog\/[^\/]+(?:\/drafts|queue)?)|(?:tagged\/[^?]+)|(?:show\/[^\/]+))/;
            var url = location.href.match(reg_top_path)[0];
            location.assign(url);
        },
        forceDelete: function forceDelete(post) {
            Tornado.funcs.shutterEffect(post);
    
            new PinNotification('Deleting... ' + post.id);
            Tornado.funcs.submitPublish(
                post.querySelector('form#delete_' + post.id),
                function(_xhr) {
                    new PinNotification('Deleted ' + post.id);
                },
                function(_xhr) {
                    alert('fail to delete');
                }
            );
        },
        delete: function _delete(post) {
            Tornado.funcs.shutterEffect(post);
            if (!confirm('Delete this post?')) {
                post.classList.remove('shutter_base');
                return;
            }
    
            new PinNotification('Deleting... ' + post.id);
            Tornado.funcs.submitPublish(
                post.querySelector('form#delete_' + post.id),
                function(_xhr) {
                    new PinNotification('Deleted ' + post.id);
                },
                function(_xhr) {
                    alert('fail to delete');
                }
            );
        },
        publish: function publish(post) {
            Tornado.funcs.shutterEffect(post);
    
            new PinNotification('Publishing... ' + post.id);
            Tornado.funcs.submitPublish(
                post.querySelector('form#publish_' + post.id),
                function(_xhr) {
                    new PinNotification('Published ' + post.id);
                },
                function(_xhr) {
                    alert('fail to publish');
                }
            );
        },
        enqueue: function enqueue(post) {
            Tornado.funcs.shutterEffect(post);
    
            new PinNotification('Enqueueing... ' + post.id);
            Tornado.funcs.submitPublish(
                post.querySelector('form#queue_' + post.id),
                function(_xhr) {
                    new PinNotification('Enqueued ' + post.id);
                },
                function(_xhr) {
                    alert('fail to enqueue');
                }
            );
        },
        default: function _default() {
            return true;  /* threw up event */
        },
    };
    
    /**
     * Shortcut の分類
     * 0: other
     * 1: default
     * 2: reblog
     * 3: channel reblog
     * 4: operator of mine
     * 5: scroll
     * 6: decorating post element
     */
    Tornado.newshortcuts = [
        new Etc.CustomKey({
                key_bind: ['s-g'],
                func: Tornado.customfuncs.goBottom,
                title: '一番下へ',
                shift: true,
                usehelp: 'hide',
                desc: {
                    ja: '一番下へスクロールします',
                    en: 'Go Bottom',
                },
                group: 5,
                grouporder: 2,
        }),
        new Etc.CustomKey({
                key_bind: ['g', 'g'],
                func: Tornado.customfuncs.goTop,
                title: '一番上へ',
                usehelp: 'hide',
                desc: {
                    ja: '一番上へスクロールします',
                    en: 'Go Top',
                },
                group: 5,
                grouporder: 1,
        }),
    ];

    Tornado.shortcuts = (function letit(){
        var customfuncs = Tornado.customfuncs;

        return [
            customkey('j', customfuncs.default, {
                title: 'Next',
                desc: {
                    ja: '次ポストへ移動',
                    en: 'Go to the next post'
                },
                group: 1,
                grouporder: 1,
            }),
            customkey('j', customfuncs.halfdown, {
                title: '下へ半スクロール',
                shift: true,
                usehelp: 'hide',
                desc: {
                    ja: '下へ半スクロールします',
                    en: 'Half scroll down'
                },
                group: 5
            }),

            customkey('k', customfuncs.default, {
                title: 'Prev',
                desc: {
                    ja: '前ポストへ移動',
                    en: 'Go the the previous post'
                },
                group: 1,
                grouporder: 2,
            }),
            customkey('k', customfuncs.halfup, {
                title: '上へ半スクロール',
                shift: true,
                usehelp: 'hide',
                desc: {
                    ja: '上へ半スクロールします',
                    en: 'Half scroll up'
                },
                group: 5
            }),

            customkey('l', customfuncs.default, {
                title: 'Like',
                desc: {
                    ja: 'Like します',
                    en: 'Like this post'
                },
                group: 1,
                grouporder: 3,
            }),

            customkey('g', customfuncs.goTop, {
                title: '一番上へ',
                follows: ['g'],
                usehelp: 'hide',
                desc: {
                    ja: '一番上へスクロールします',
                    en: 'Go Top',
                },
                group: 5,
                grouporder: 1,
            }),
            customkey('g', customfuncs.goBottom, {
                title: '一番下へ',
                shift: true,
                usehelp: 'hide',
                desc: {
                    ja: '一番下へスクロールします',
                    en: 'Go Bottom',
                },
                group: 5,
                grouporder: 2,
            }),
            customkey('o', customfuncs.jumpToLastCursor, {
                title: '最後のカーソルへ飛ぶ',
                desc: {
                    ja: 'gg や G で移動した際に最後のカーソル位置へ戻ります',
                    en: 'Go back Last Cursor(when gg, G)'
                },
                shift: true,
                usehelp: false,
                group: 5,
                grouporder: 3,
            }),

            customkey('t', customfuncs.reblog, {
                title: 'Reblog',
                desc: {
                    ja: '通常のリブログを行います',
                    en: 'Reblog'
                },
                group: 2,
                grouporder: 1,
            }),
            customkey('h', customfuncs.fast_reblog, {
                title: 'fast Reblog',
                desc: {
                    ja: '高速リブログを行います',
                    en: 'Fast Reblog',
                },
                group: 2,
                grouporder: 2,
            }),
            customkey('d', customfuncs.draft, {
                title: 'Draft',
                desc: {
                    ja: '下書きへ送ります',
                    en: 'Save as draft'
                },
                group: 2,
                grouporder: 3,
            }),
            customkey('q', customfuncs.queue, {
                title: 'Queue',
                desc: {
                    ja: 'キューへ送ります',
                    en: 'Add to queue'
                },
                group: 2,
                grouporder: 5,
            }),
            customkey('p', customfuncs.private, {
                title: 'Private',
                desc: {
                    ja: 'プライベートなリブログを行います',
                    en: 'Private reblog'
                },
                group: 2,
                grouporder: 5,
            }),
            
            customkey(['1', '2', '3', '4', '5', '6', '7', '8', '9'], customfuncs.directReblogToChannel, {
                title: 'channel Reblog',
                desc: 'channel へすぐにリブログします',
                usehelp: 'hide',
                group: 3,
                grouporder: 5,
            }),

            customkey('t', customfuncs.reblogToChannel, {
                title: 'channel Reblog',
                follows: ['g'],
                desc: {
                    ja: 'channel へリブログ',
                    en: 'Reblog to channel',
                },
                group: 3,
                grouporder: 1,
            }),
            customkey('d', customfuncs.draftToChannel, {
                title: 'channel Draft',
                follows: ['g'],
                desc: {
                    ja: 'channel へ下書き',
                    en: 'Save to channel as draft'
                },
                group: 3,
                grouporder: 2,
            }),
            customkey('q', customfuncs.queueToChannel, {
                title: 'channel Queue',
                follows: ['g'],
                desc: {
                    ja: 'channel のキューへ送る',
                    en: 'Add to channel to queue'
                },
                group: 3,
                grouporder: 3,
            }),
            customkey('p', customfuncs.privateToChannel, {
                title: 'channel Private',
                follows: ['g'],
                desc: {
                    ja: 'channel の private でリブログ',
                    en: 'Private reblog'
                },
                group: 3,
                grouporder: 4,
            }),

            customkey('i', customfuncs.scaleImage, {
                title: 'photo, video 開閉',
                desc: {
                    ja: '画像や動画ポストを拡縮、開閉します',
                    en: 'Scale image or Open video'
                },
                group: 0
            }),
            customkey('m', customfuncs.rootInfo, {
                title: 'Root 投稿者情報',
                desc: {
                    ja: 'Root 投稿者情報を取得します',
                    en: 'Get root post user',
                },
                group: 0
            }),
            customkey('v', customfuncs.viewPostPageInBackground, {
                title: 'ポストを開く',
                desc: {
                    ja: '現在のポストを新タブで開きます',
                    en: 'Open new tab this post'
                },
                usehelp: 'hide',
                group: 5
            }),

            customkey('c', customfuncs.cleanPosts, {
                title: '上ポストを空白',
                usehelp: 'hide',
                desc: {
                    ja: '現在より上のポストを空の状態にします',
                    en: 'Clean above post'
                },
                group: 6,
                grouporder: 1,
            }),
            customkey('c', customfuncs.removePosts, {
                title: '上ポストを削除',
                shift: true,
                usehelp: 'hide',
                desc: {
                    ja: '現在より上のポストを画面から削除します',
                    en: 'Remove above post'
                },
                group: 6,
                grouporder: 2,
            }),
            customkey('c', customfuncs.removeBottomPosts, {
                title: '下ポストを削除',
                shift: true,
                follows: ['g'],
                usehelp: 'hide',
                desc: {
                    ja: '現在より下のポストを画面から削除します',
                    en: 'Remove following post'
                },
                group: 6,
                grouporder: 3,
            }),

            customkey('n', customfuncs.default, {
                title: 'Notes',
                usehelp: 'hide',
                desc: {
                    ja: 'Notes を開閉',
                    en: 'Open Notes'
                },
                group: 1,
                grouporder: 4,
            }),
            customkey('r', customfuncs.topReload, {
                shift: true,
                usehelp: 'hide',
                group: 0
            }),
            customkey('s', customfuncs.endlessSummer, {
                title: 'Endless Summer',
                shift: true,
                desc: {
                    ja: 'ダッシュボードの下降をランダムにします',
                },
                group: 0
            }),

            customkey('d', customfuncs.delete, {
                title: '自ポストを削除',
                desc: {
                    ja: 'Post が自分のものならばポストを削除します',
                    en: 'Delete my post'
                },
                has_selector: 'form[id^=delete]',
                usehelp: 'hide',
                group: 4
            }),
            customkey('d', customfuncs.forceDelete, {
                title: '自ポストを強制削除',
                desc: {
                    ja: '確認ボックスを表示することなくポストを削除します',
                    en: 'Force delete my post',
                },
                shift: true,
                has_selector: 'form[id^=delete]',
                usehelp: 'hide',
                group: 4
            }),
            customkey('p', customfuncs.publish, {
                title: '自ポストを公開',
                desc: {
                    ja: 'Drafts か Queue のポストを公開します',
                    en: 'Publish my post drafted or queued'
                },
                has_selector: 'form[id^=publish]',
                usehelp: 'hide',
                group: 4
            }),
            customkey('q', customfuncs.enqueue, {
                title: '下書きをキューに',
                desc: {
                    ja: 'Drafts を Queue へ納めます',
                    en: 'Enqueue my draft',
                },
                has_selector: 'form[id^=queue]',
                usehelp: 'hide',
                group: 4
            })
        ]
    })();
    
    Tornado._shortcuts = Tornado.shortcuts.slice();
    Tornado._shortcuts.sort(function(a, b){
        return (a.group || 10) - (b.group || 10) ||
               (a.grouporder) - (b.grouporder);
    });

    Tornado.shortcuts.sort(function(a, b) {
        return ((b.follows.length - a.follows.length) ||
                (b.has_selector.length - a.has_selector.length) ||
                ((b.url || '').length - ((a.url || '').length)));
    });

    /**
     * クライアントページの情報を元に tumblelog の設定を回収します
     */
    Tornado.initTumblelogConfigs = function() {
        if ($$('#base_template').length == 0) {
            return;
        }

        var base_template = Etc.buildElementBySource($$('#base_template')[0].innerHTML);
        var config_elms = base_template.querySelectorAll('#tumblelog_choices .popover_post_options .option');

        Tornado.tumblelog_configs = {};

        Array.prototype.slice.call(config_elms).map(function(elm) {
            var i;
            var attrs = elm.attributes;
            var name = elm.getAttribute('data-option-value');

            Tornado.tumblelog_configs[name] = {};

            for (i = 0; i < attrs.length; ++i) {
                Tornado.tumblelog_configs[name][attrs[i].name] = attrs[i].value;
            }
        });
    };

    /**
     * クライアントページ領域に関数を定義させます
     */
    Tornado.clientfuncs = [
        /**
         * RootInfo用のAPIのデータを受け取り実際に埋め込む関数です
         * @param {Object} json Tumblr API が返す JSON オブジェクト
         */
        function jsonpRootInfo(json) {
            var post = json.response.posts[0];
            var root_name = post.reblogged_root_name;
            var root_url = post.reblogged_root_url;
            var text_root_link = (root_name ? (['<a href="', root_url, '">', root_name, '</a>'].join('')) : 'missing');
        
            var node_post = document.querySelector('#post_' + post.id);
            var root_info = node_post.querySelector('.root_info');
            root_info.innerHTML = ' [' + text_root_link + ']';
        
            var script = document.querySelector('#showroot_' + post.id);
            script.parentNode.removeChild(script);
        },
        /**
         * 次ページパスを訂正すべき場合は正常な次ページパスを返します
         * @return 次ページ path か null
         */
        function next_pageCorrection() {
            var m, type, pagenum;
            if (m = location.href.match(/show\/(photos|text|quotes|links|chats|audio|videos)\/?(\d+)?/)) {
                type = m[1];
                pagenum = (m[2] == undefined) ? 2 : parseInt(m[2]) + 1;
                next_page = '/show/' + type + '/' + pagenum;
            }
        },
        /**
         * pjax ライクにページの読み込みとロケーションバーを連動させます
         */
         function dsbdPjax() {
            next_pageCorrection();
            history.pushState('', '', next_page);
         },
         /**
          * Dashboard をランダムに降下する為の機能です
          */
         function endlessSummer() {
            var oldest_id = 264102; // http://ku.tumblr.com/post/264102
            var name = 'endless_summer';

            if (ShareValue.get(name, false) === "false") {
                return;
            }

            var path = location.href.match(/\/dashboard(\/(\d+)\/(\d+))?/);
            var page, last_id;
            var page = (path[2] ? parseInt(path[2]) : 1),
                last_id = path[3];

            var next_id = parseInt(Math.random() * window.endless_summer_first_post_id + oldest_id);
            next_page = '/dashboard/' + (page + 1) + '/' + next_id;
         },
         Etc.buildElement,
    ];

    /**
     * クライアントページ領域で実行させます
     * 文字列は文字列の成すように、関数は関数を実行します。
     */
    Tornado.clientlaunches = [
        'BeforeAutoPaginationQueue.push(dsbdPjax);',
        'BeforeAutoPaginationQueue.push(endlessSummer);',
        'if (/^\\/blog\\/[^\\/]+\\/queue/.test(location.pathname)) {' +
            'Tumblr.enable_dashboard_key_commands = true;' +
            'Tumblr.KeyCommands = new Tumblr.KeyCommandsConstructor();' +
        '}',
        '(window.Tumblr) && (Tumblr.KeyCommands) && (Tumblr.KeyCommands.scroll_speed=20);',
        'window.ison_endless_summer = false;',
        'window.endless_summer_first_post_id = parseInt(document.querySelector("#posts>.post[data-post-id]").getAttribute("data-post-id"));',
        'ShareValue = ' + Etc.serialize(Etc.ShareValue) + ';',
    ];


    /**
     * tornado の oauth 設定
     */
    Tornado.windows.tornado_config = function tornado_config(e) {
        var config_dialog = new LiteDialog('Tumblr Tornado Config');
        var dialog_body = config_dialog.dialog.querySelector('.lite_dialog_body');

        if (typeof OAuth == 'undefined') {
            dialog_body.innerHTML = 
                 '<p>この環境ではこの機能に対応していません。</p>'
               + '<p>Chrome では <a href="https://chrome.google.com/webstore/detail/ninjakit/gpbepnljaakggeobkclonlkhbdgccfek">NinjaKit</a> か'
               + ' <a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo">Tampermonkey</a> を、'
               + ' Firefox では <a href="https://addons.mozilla.org/firefox/addon/greasemonkey/">Greasemonkey</a> の使用を推奨します。</p>';
            config_dialog.centering();
            return;
        }

        var request_button = dialog_body.appendChild(Etc.buildElement('button', {}, Tornado.funcs.i18n({ja: 'OAuth 認証します', en: 'Authorize OAuth'})));
        request_button.addEventListener('click', function() {
            var request_accessor = Tornado.oauth.getRequestToken();
            GM_setValue('oauth_token_secret', request_accessor.oauth_token_secret);

            location.href = 'http://www.tumblr.com/oauth/authorize?oauth_token=' + request_accessor.oauth_token;
        });

        var reset_button = dialog_body.appendChild(Etc.buildElement('button', {}, Tornado.funcs.i18n({ja: 'OAuth 情報を消去します', en: 'Clear OAuth information'})));
        reset_button.addEventListener('click', function() {
            GM_deleteValue('oauth_token_secret');
            GM_deleteValue('oauthconfigs');
        });

        Tornado.oauthconfigs = JSON.parse(GM_getValue('oauthconfigs', '[]'));
        Tornado.exclude_tumblelogs = JSON.parse(GM_getValue('exclude_tumblelogs', '{}'));

        var config_list = dialog_body.appendChild(Etc.buildElement('ul', {class: 'oauth_config'}));

        Tornado.oauthconfigs.map(function(oauth_config, i){
            var li = config_list.appendChild(Etc.buildElement('li', {}, 'id:' + oauth_config.id));
            var delete_button = li.appendChild(Etc.buildElement('button', {class: 'button' + i}, 'アカウント情報を消去'));

            delete_button.addEventListener('click', function(e) {
                var button = e.target;
                var i = parseInt(button.className.match(/button(\d+)/)[1]);

                Tornado.oauthconfigs = JSON.parse(GM_getValue('oauthconfigs', '[]'));
                Tornado.oauthconfigs = Tornado.oauthconfigs.filter(function(j,k) {return k != i;});
                GM_setValue('oauthconfigs', JSON.stringify(Tornado.oauthconfigs));

                Tornado.exclude_tumblelogs = JSON.parse(GM_getValue('exclude_tumblelogs', '{}'));
                delete Tornado.exclude_tumblelogs[oauth_config.id];
                GM_setValue('exclude_tumblelogs', JSON.stringify(Tornado.exclude_tumblelogs));

                li.parentNode.removeChild(li);
            });

            var ol = li.appendChild(Etc.buildElement('ol'));

            oauth_config.tumblelogs.map(function(tumblelog, j) {
                var checked, list_tumblelog;

                checked = (Tornado.exclude_tumblelogs[oauth_config.id]
                           ? (Tornado.exclude_tumblelogs[oauth_config.id][tumblelog.hostname] === true
                              ? ''
                              : 'checked')
                           : 'checked');

                list_tumblelog = ol.appendChild(Etc.buildElement('li', {}, '<label><input type="checkbox" ' + checked + '/><span>' + tumblelog.hostname + ': ' + tumblelog.name + '</span></label>'));
                list_tumblelog.querySelector('input[type=checkbox]').addEventListener('change', function(e) {
                    if (Tornado.exclude_tumblelogs[oauth_config.id] == undefined) {
                        Tornado.exclude_tumblelogs[oauth_config.id] = {};
                    }

                    if (e.target.checked) {
                        Tornado.exclude_tumblelogs[oauth_config.id][tumblelog.hostname] = false;
                    }
                    else {
                        Tornado.exclude_tumblelogs[oauth_config.id][tumblelog.hostname] = true;
                    }

                    GM_setValue('exclude_tumblelogs', JSON.stringify(Tornado.exclude_tumblelogs));
                });
            });
        });

        config_dialog.centering();
    };

    Tornado.windows.tornado_help = function tornado_help (e) {
        var help_dialog = new LiteDialog('Tumblr Tornado Help');
        var dialog_body = help_dialog.dialog.querySelector('.lite_dialog_body');
    
        help_dialog.dialog.id = 'tornado_help_dialog';
    
        var helps_list = Etc.buildElement('table', {border: '1', class: 'tornado_help_list'});
    
        Tornado._shortcuts.map(function(shortcut, i, all) {
            var label;
    
            if (i == 0 ||
                all[i-1].group != all[i].group) {
                var tr = Etc.buildElement('tr', {class: 'tornado_short_groupname', style: 'font-weight: bold; font-size: 20px; text-align: center;'});
                label = Etc.buildElement('th', {colspan: '3'});
                label.innerHTML = Tornado.funcs.i18n([
                    {
                        ja: 'その他のコマンド',
                        en: 'Other Commands'
                    },
                    {
                        ja: '標準のコマンド',
                        en: 'Default Commands'
                    },
                    {
                        ja: 'Reblog コマンド',
                        en: 'Reblog Commands'
                    },
                    {
                        ja: 'チャンネル Reblog コマンド',
                        en: 'Channel Reblog Commands'
                    },
                    {
                        ja: '自ポストへの操作コマンド',
                        en: 'Operating your post'
                    },
                    {
                        ja: 'スクロールコマンド',
                        en: 'Scroll Commands'
                    },
                    {
                        ja: 'ポストの表示操作',
                        en: 'Operation post display'
                    },
                    ][shortcut.group]);
                tr.appendChild(label);
                helps_list.appendChild(tr);

                tr = Etc.buildElement('tr', {},
                       ["<td class=\"tornado_short_title\">Title</td>",
                         "<td class=\"tornado_short_key\">Key</td>",
                         "<td class=\"tornado_short_desc\">Description</td>"].join(''));
                tr.style.cssText = "text-align: center;";
                helps_list.appendChild(tr);
            }
    
            /* TODO: title と key を一つの要素に納めます */
            var li = Etc.buildElement('tr'),
                title_box = Etc.buildElement('td', {class: 'tornado_short_title'}),
                key_box = Etc.buildElement('td', {class: 'tornado_short_key', style: 'text-align: center;'}),
                desc_box = Etc.buildElement('td', {class: 'tornado_short_desc'});
    
            var key = [], desc, options;
    
            title_box.innerHTML = (shortcut.title || shortcut.func.name || (typeof shortcut.func == "string" ? shortcut.func : "No Title"));
    
            if (shortcut.follows) {
                key = key.concat(shortcut.follows);
            }
            key.push((shortcut.ctrl  ? 'Ctrl+'  : '') +
                     (shortcut.alt   ? 'Alt+'   : '') +
                     (shortcut.shift ? 'Shift+' : '') +
                     shortcut.match);
    
            key_box.innerHTML = key.join(', ');

            var description = (shortcut.desc && (shortcut.desc[Tornado.lang] || shortcut.desc['en'] || shortcut.desc['ja'] || shortcut.desc)) ||
                               shortcut.func.name;
            var desc = Etc.buildElement('p', {}, description);
    
            desc_box.appendChild(desc);
    
            options = Etc.buildElement('ul', {class: 'tornado_help_options'});
            if (shortcut.has_selector) {
                options.appendChild(Etc.buildElement('li', {}, 'Selector: ' + shortcut.has_selector.replace('<', '&lt;')));
            }
            if (shortcut.url) {
                options.appendChild(Etc.buildElement('li', {}, 'URL: ' + shortcut.url.toString().replace('<', '&lt;')));
            }
    
            desc_box.appendChild(options);
    
            li.appendChild(title_box);
            li.appendChild(key_box);
            li.appendChild(desc_box);
    
            helps_list.appendChild(li);
        });
    
        dialog_body.appendChild(helps_list);

        /* ソースへのリンク */
        dialog_body.appendChild(document.createElement('hr'));
        dialog_body.appendChild(Etc.buildElementBySource([
                '<div style="text-align: right;">',
                'Tumblr Tornado Repositories',
                '(',
                '<a href="https://userscripts.org/scripts/show/137667">stable</a>',
                ', ',
                '<a href="https://github.com/poochin/tumblrscript/blob/master/userscript/tumblr_tornado.user.js">beta</a>',
                ', ',
                '<a href="https://github.com/poochin/tumblrscript/blob/dev/userscript/tumblr_tornado.user.js">alpha</a>',
                ')',
                '</div>'
                ].join('\n')));

        
        help_dialog.centering();
    };

    /**
     * 右カラムにヘルプを表示します
     */
    function showShortcutHelp() {
        var rightcolumn_help, header_help, helps;
    
        var rightcolumn_help = Etc.buildElement('div',
            {id: 'tornado_rightcolumn_help'});
    
        var header_help = Etc.buildElement('p',
            {}, 
            'Tumblr Tornado <span class="show_tornado_config">[conf]</span> <span class="show_tornado_help">[ ? ]</span>');

        /* Tornado config ウィンドウを表示します */
        header_help.querySelector('span.show_tornado_config').addEventListener('click', Tornado.windows.tornado_config);

        /* ヘルプウィンドウを表示します */
        header_help.querySelector('span.show_tornado_help').addEventListener('click', Tornado.windows.tornado_help);
    
        rightcolumn_help.appendChild(header_help);
    
        var helps = Etc.buildElement('ul',
            {id: 'tornado_shortcuts_help'});
    
        Tornado._shortcuts.map(function(shortcut, i) {
            if (shortcut.usehelp == false ||
                shortcut.usehelp == 'hide') {
                return;
            }
            var help = Etc.buildElement('li',
                {},
                Etc.buildShortcutLineHelp(shortcut));
            helps.appendChild(help);
        });
    
        rightcolumn_help.appendChild(helps);

        rightcolumn_help.appendChild(Etc.buildElement('fieldset', {
                id: 'tornado_share_value',
                style: "display:none;"}));

        (function letit(right_column){
            if (right_column) {
                right_column.appendChild(rightcolumn_help);
            }
        })(document.querySelector('#right_column'));
    }

    Tornado.oauth.getRequestToken = function getRequestToken() {
        var url = 'http://www.tumblr.com/oauth/request_token';
        var accessor = {
            consumerKey: Tornado.vals.CONSUMER_KEY,
            consumerSecret: Tornado.vals.CONSUMER_SECRET
        };

        var message = { method: 'GET', action: url};
        var request_body = OAuth.formEncode(message.parameters);
        OAuth.completeRequest(message, accessor);

        var a = new Ajax(message.action, {
            method: message.method, 
            asynchronous: false,
            parameters: request_body,
            requestHeaders: [
                'Authorization', OAuth.getAuthorizationHeader('', message.parameters),
            ],
        })

        var response = OAuth.decodeForm(a.xhr.responseText);
        var result = {};

        result[response[0][0]] = response[0][1];
        result[response[1][0]] = response[1][1];
        result[response[2][0]] = response[2][1];

        return result;
    };

    Tornado.oauth.getAccessToken = function getAccessToken() {
        var tokens = OAuth.decodeForm(location.search.slice(1));
        var tokenSecret = GM_getValue('oauth_token_secret');

        var url = 'http://www.tumblr.com/oauth/access_token';

        var accessor = {
            consumerKey: Tornado.vals.CONSUMER_KEY,
            consumerSecret: Tornado.vals.CONSUMER_SECRET,
            token: tokens[0][1],
            tokenSecret: tokenSecret,
        };

        var parameters = {
            oauth_verifier: tokens[1][1],
        };

        var message = {
            method: 'POST',
            action: url,
            parameters: parameters,
        };

        var request_body = OAuth.formEncode(message.parameters);
        OAuth.completeRequest(message, accessor);

        var a = new Ajax(message.action, {
            method: message.method,
            parameters: message.parameters,
            asynchronous: false,
            requestHeaders: [
                'Authorization', OAuth.getAuthorizationHeader('', message.parameters),
            ],
        });

        var response = OAuth.decodeForm(a.xhr.responseText);
        var access_tokens = {};

        access_tokens[response[0][0]] = response[0][1];
        access_tokens[response[1][0]] = response[1][1];

        return access_tokens;
    };

    Tornado.oauth.verifyAccessToken = function verifyAccessToken() {
        var access_tokens = Tornado.oauth.getAccessToken();

        var base_name = document.querySelector('#search_field [name=t]').value;

        var tumblelogs =  $$('#popover_blogs .item a').map(function(item){
            return {
                name: item.text.trim(),
                hostname: item.href.split('/').slice(-1)[0] + '.tumblr.com'
            }
        });

        var oauth_config = {
            id: base_name,
            token: access_tokens.oauth_token,
            token_secret: access_tokens.oauth_token_secret,
            tumblelogs: tumblelogs,
        };

        var new_setting = new LiteDialog('New OAuth Settings');
        var setting_body = new_setting.dialog.querySelector('.lite_dialog_body');

        setting_body.appendChild(Etc.buildElement('p', {}, 'OAuth token: ' + access_tokens.oauth_token));
        setting_body.appendChild(Etc.buildElement('p', {}, 'OAuth token secret: ' + access_tokens.oauth_token_secret));

        var tumblelog_list = setting_body.appendChild(Etc.buildElement('ul'));

        tumblelogs.map(function(tumblelog) {
            tumblelog_list.appendChild(Etc.buildElement('li', {},
                'Name: ' + tumblelog.name + '<br />' +
                'Host name: ' + tumblelog.hostname + '<br />'));
        });

        var ok = setting_body.appendChild(Etc.buildElement('button', {}, 'この設定を保存します'));

        ok.addEventListener('click', function() {
            Tornado.oauthconfigs = JSON.parse(GM_getValue('oauthconfigs', '[]'));
            Tornado.oauthconfigs.push(oauth_config);

            GM_setValue('oauthconfigs', JSON.stringify(Tornado.oauthconfigs));
            GM_deleteValue('oauth_token_secret');

            new_setting.dialog.parentNode.removeChild(new_setting.dialog);

            new PinNotification('認証情報を保存しました。');
            new PinNotification('3 秒後にリロードします。');
            new PinNotification('設定は [conf] から確認できます。');

            setTimeout(function(){location.href = '/dashboard'}, 3000);
        }, false);

        new_setting.centering();
    };

    /**
     * ページロード時に一度だけ呼び出されます
     */
    function main() {
        Tornado.initTumblelogConfigs();

        document.addEventListener('keydown', Tornado.keyevent, true);

        var style = document.head.appendChild(document.createElement('style'));
        style.className = 'tumblr_userscript';
        style.innerHTML = Tornado.css;

        showShortcutHelp();

        Etc.execScript(Tornado.clientfuncs.join(''));

        Etc.execScript(Tornado.clientlaunches.map(function(code) {
            if (typeof code === 'string') {
                return code + ';\n';
            }
            else if (typeof code === 'function') {
                return '(' + (code) + ')();\n';
            }
        }).join(''));


        if (typeof OAuth != 'undefined' && /dashboard\?oauth_token=/.test(location)) {
            Tornado.oauth.verifyAccessToken();
        }
    }

    /**
     * Opera 用に起動するべきページかどうかを判定しています
     */
    if (window.document.body) {
        if (Tornado.browser == 'opera') {
            if (/^https?:\/\/www\.tumblr\.com\//.test(location)) {
                main();
            }
        }
        else {
            main();
        }
    }
    else {
        window.document.addEventListener('DOMContentLoaded', main, false);
    }

})();


/*
* History *
2012-07-04
ver 1.1.7
    * viewPagePostInBackground を追加しました *

    @charz_red さんのアイディアによりポストを開く機能を付けました。
    自分のポストを Delete したい際に確認ダイアログを表示しない forceDelete 機能を付けました。

2012-06-08
ver 1.1.4
    * /show 系で変な next_page が設定される不具合を取りました *

2012-06-04
ver 1.1.3
    * reblog 時 に post を閃かせる効果を追加しました *

    @tantarotar さんの意見を採用して taberareloo + chormekeyconfig を用いた際の reblog 時の閃きを取り入れました。

2012-05-19
ver 1.1.2
    * removeBottomPosts を追加しました *

    @charz_red さんのアイディアで removeBottomPosts を組込みました。

2012-05-21
ver 1.1.1
    * リファクタリングを行いました *

2012-05-18
ver 1.1.0
    * コマンドを Tornado 直下から切り離すようにしました *

    jsdoc 向けのコメントを書きました

2012-05-04
ver 1.0.10
    * ポストが自分からのリブログだった際に .reblogged_you クラスを付けるようにしました。 *

2012-04-30
ver 1.0.9
    * Ajax クラスを prototype.js 風の引数を持つようにしました *

ver 1.0.8
    * Pin Notification の表示方法を変えました *

    Pin Notification バルーンが複数表示された際に一つのバルーンで表示するようにしました。

    Opera 向けに現在の URL をチェックする分岐を追加しました。

    quque ページでデフォルトのショートカットキー(J/K)が動作していなかったので動くようにしました。

2012-04-29
ver 1.0.7
    * is_mine のポストを queue, draft, delete する機能を付けました *

    customkey に子孫要素の css selector を探るオプションを付けることで、
    is_mine のポストで queue, draft, delete する機能を付けました。
    これによって drafts と delete は同じキーが割り当てられています。

2012-04-27
ver 1.0.6
    * shortcuts を dict から list に変更 *

    Tornado.shortcuts を辞書型からリスト型に変更しました。
    これによりヘルプの順序の設定が任意に行えるようになりました。

ver 1.0.5
    * トップリロード機能 *

    dashboard, likes, blog, drafts, queue などで各トップに飛ぶリロード機能を付けました。

2012-04-26
ver 1.0.4.0
    * リファクタリング *

    shortcuts の参照で重複している部分を一様にさばけるようにして keyevent や help をスリムにしました。

    video の拡縮を一様にトグルできるようにしました。

2012-04-25
ver 1.0.3.0
    * rootInfo を取得できるようにしました *

    最初にポストした投稿者の情報を取得する機能を付けました。

ver 1.0.2
    * ショートカットを拡張 *

    Shift+D などが思いの外使いづらかったので G-D とキーバインドを繋げられるようにしました。

2012-04-24
ver 1.0.1.0
    * Google chrome, Firefox+GM, Opera に対応 *

    box-shadow, animation を複数のブラウザに対応するように記述しました。

2012-04-23
ver 1.0.0.0
    * パイロット版を公開 *

    Google chrome 上でのみ動作するようにしています。

    Shift + Command でショートカットに拡張性をもたせやすい UserScript を目指して書きました。
    また既存の UserScript にはチャンネル投稿に対応したものが見当たらないので新しく書きました。

    autoload 時にロケーションバーに記憶させる案は Tumblr Life からいただきました。
    コピーはしていませんが、どのように書くのかをソースコードを読み勉強させてもらいました(実質コピー)。

    cleanPosts の案は SuperTumblr からいただきました。
    ただし li.post が残るとゆくゆくコマンドの遅延が危ぶまれるため .post を class から取り除くようにしています。
    また実装部分も SuperTumblr とは違う方法を取っています。
*/
