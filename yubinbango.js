var CACHE = [];
var YubinBango;
(function (YubinBango) {
    var Core = /** @class */ (function () {
        function Core(inputVal, callback) {
            if (inputVal === void 0) { inputVal = ''; }
            this.URL = 'https://yubinbango.github.io/yubinbango-data/data';
            this.REGION = [
                null, '北海道', '青森県', '岩手県', '宮城県',
                '秋田県', '山形県', '福島県', '茨城県', '栃木県',
                '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
                '新潟県', '富山県', '石川県', '福井県', '山梨県',
                '長野県', '岐阜県', '静岡県', '愛知県', '三重県',
                '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県',
                '和歌山県', '鳥取県', '島根県', '岡山県', '広島県',
                '山口県', '徳島県', '香川県', '愛媛県', '高知県',
                '福岡県', '佐賀県', '長崎県', '熊本県', '大分県',
                '宮崎県', '鹿児島県', '沖縄県'
            ];
            if (inputVal) {
                // 全角の数字を半角に変換 ハイフンが入っていても数字のみの抽出
                var a = inputVal.replace(/[０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 65248); });
                var b = a.match(/\d/g);
                var c = b.join('');
                var yubin7 = this.chk7(c);
                // 7桁の数字の時のみ作動
                if (yubin7) {
                    this.getAddr(yubin7, callback);
                }
                else {
                    callback(this.addrDic());
                }
            }
        }
        Core.prototype.chk7 = function (val) {
            if (val.length === 7) {
                return val;
            }
        };
        Core.prototype.addrDic = function (region_id, region, locality, street, extended) {
            if (region_id === void 0) { region_id = ''; }
            if (region === void 0) { region = ''; }
            if (locality === void 0) { locality = ''; }
            if (street === void 0) { street = ''; }
            if (extended === void 0) { extended = ''; }
            return {
                'region_id': region_id,
                'region': region,
                'locality': locality,
                'street': street,
                'extended': extended
            };
        };
        Core.prototype.selectAddr = function (addr) {
            if (addr && addr[0] && addr[1]) {
                return this.addrDic(addr[0], this.REGION[addr[0]], addr[1], addr[2], addr[3]);
            }
            else {
                return this.addrDic();
            }
        };
        Core.prototype.jsonp = function (url, fn) {
            window['$yubin'] = function (data) { return fn(data); };
            var scriptTag = document.createElement("script");
            scriptTag.setAttribute("type", "text/javascript");
            scriptTag.setAttribute("charset", "UTF-8");
            scriptTag.setAttribute("src", url);
            document.head.appendChild(scriptTag);
        };
        Core.prototype.getAddr = function (yubin7, fn) {
            var _this = this;
            var yubin3 = yubin7.substr(0, 3);
            // 郵便番号上位3桁でキャッシュデータを確認
            if (yubin3 in CACHE && yubin7 in CACHE[yubin3]) {
                return fn(this.selectAddr(CACHE[yubin3][yubin7]));
            }
            else {
                this.jsonp(this.URL + "/" + yubin3 + ".js", function (data) {
                    CACHE[yubin3] = data;
                    return fn(_this.selectAddr(data[yubin7]));
                });
            }
        };
        return Core;
    }());
    YubinBango.Core = Core;
})(YubinBango || (YubinBango = {}));
/// <reference path="./node_modules/yubinbango-core/yubinbango-core.ts"/>
var ISO31661JP = ["Japan", "JP", "JPN", "JAPAN"];
var HADRLIST = ["p-region-id", "p-region", "p-locality", "p-street-address", "p-extended-address"];
var YubinBango;
(function (YubinBango) {
    var MicroformatDom = /** @class */ (function () {
        function MicroformatDom() {
            this.hadrloop();
        }
        MicroformatDom.prototype.hadrloop = function () {
            var _this = this;
            // HTML内のh-adr要素のリストに対して操作を行う
            var hadrs = document.querySelectorAll('.h-adr');
            [].map.call(hadrs, function (hadr) {
                // country-name が日本かどうかチェック
                if (_this.countryNameCheck(hadr)) {
                    // 郵便番号の入力欄を取得
                    var postalcode = hadr.querySelectorAll('.p-postal-code');
                    // 郵便番号入力欄が1つの場合でも3桁-4桁で2つに分かれている場合でも両方に対応するため、それぞれのh-adr内の中の最後のpostal-codeにkeyupイベントを付与する
                    postalcode[postalcode.length - 1].addEventListener("keyup", function (e) {
                        MicroformatDom.prototype.applyDom(_this.getFormNode(e.target.parentNode));
                    }, false);
                }
            });
        };
        MicroformatDom.prototype.getFormNode = function (elm) {
            return (elm.tagName !== "FORM" && !elm.classList.contains("h-adr")) ? this.getFormNode(elm.parentNode) : elm;
        };
        // 日本かどうかチェックする
        MicroformatDom.prototype.countryNameCheck = function (elm) {
            var a = elm.querySelector('.p-country-name');
            var arr = [a.innerHTML, a.value];
            return (arr.some(function (val) { return (ISO31661JP.indexOf(val) >= 0); }));
        };
        MicroformatDom.prototype.applyDom = function (elm) {
            var _this = this;
            var postalcode = elm.querySelectorAll('.p-postal-code');
            new YubinBango.Core(this.reduceVal(postalcode), function (address) { return _this.setAddr(elm, address); });
        };
        MicroformatDom.prototype.reduceVal = function (postalcode) {
            return [].map.call(postalcode, function (a) { return a.value; }).reduce(function (a, b) { return a + b; });
        };
        MicroformatDom.prototype.setAddr = function (elm, address) {
            var fnlist = [this.postalFormClear, this.postalFormSet];
            // 住所欄に入力されているデータを削除 & 住所欄に入力
            fnlist.map(function (fn) { return HADRLIST.map(function (val) { return fn(val, elm, address); }); });
        };
        MicroformatDom.prototype.postalFormClear = function (val, elm, data) {
            if (data) {
                var addrs = elm.querySelectorAll('.' + val);
                [].map.call(addrs, function (addr) {
                    return addr.value = '';
                });
            }
        };
        MicroformatDom.prototype.postalFormSet = function (val, elm, data) {
            var o = {
                "p-region-id": data.region_id,
                "p-region": data.region,
                "p-locality": data.locality,
                "p-street-address": data.street,
                "p-extended-address": data.extended
            };
            var addrs = elm.querySelectorAll('.' + val);
            [].map.call(addrs, function (addr) {
                return addr.value += (o[val]) ? o[val] : '';
            });
        };
        return MicroformatDom;
    }());
    YubinBango.MicroformatDom = MicroformatDom;
})(YubinBango || (YubinBango = {}));
document.addEventListener('DOMContentLoaded', function () {
    new YubinBango.MicroformatDom();
}, false);
