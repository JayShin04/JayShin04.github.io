---
layout: post
title: "DOM 기반 Clickjacking / DEFCON 컨퍼런스 리뷰"
date: 2026-05-27 00:00:00 +0900
category: 논문/컨퍼런스
---


### 참고 영상
<a href="https://www.youtube.com/watch?v=Gu4IoDXNqoU" target="_blank" style="color: #4878a1">DEF CON 33 - 브라우저 확장 프로그램 클릭재킹: 단 한 번의 클릭으로 신용카드 정보가 유출됩니다 - 마렉 토트 </a>

# 1. Clickjacking이란?

들어가기 앞서, Clickjacking이란 무슨 취약점인지 짚고 넘어가보자. <br>
<br>
클릭재킹(Clickjacking), 또는 "UI Redress Attack"이라고도 불리는 이 공격은 공격자가 여러 개의 투명하거나 불투명한 레이어를 이용하여 사용자가 최상위 페이지의 버튼이나 링크를 클릭하려 할 때 다른 페이지의 버튼이나 링크를 유도하는 행위이다. <br>
쉽게 말하자면, 사용자가 클릭하는 곳에다가 투명한 이미지 파일로 사용자가 보는 것과는 다른 동작을 하게끔 유도하는 것이라고 해석했다. <br>
<br>
그러나 이러한 투명한 iframe을 이용하여 사용자가 보이지 않는 버튼을 누르게 만드는 방식은 2000년대에서나 나오던 오래된 방식이었다.<br>
`X-Frame-Options` HTTP헤더를 이용하거나 Content Security Policy(CSP)의 frame-ancestors, SameSite Cookie의 Lax, Strict 같은 방어책도 널리 사용된다. 그래서 많은 버그바운티 프로그램에서는 클릭재킹을 낮은 영향도의 취약점으로 평가하거나 아예 적용 제외 대상으로 두었다. <br>

# 2. 영상 속 Browser Extension Clickjacking은 무엇이 다른가?
1번에서 서술했듯이, Clickjacking은 오래된 공격 기법이라면, DEF CON 33 영상에 나올 이유가 없다고 봐도 무방하다. 그렇기에 나는 이 영상에 더더욱 끌리게 되어 리뷰하게 되었다. <br>
<br>
Marek Tóth가 발표한 **Browser Extension Clickjacking: One Click and Your Credit Card Is Stolen**은 클릭재킹이 우리가 흔히 사용하는 브라우저 확장 프로그램에서 발견되었다고 말한다. <br>

### Intrusive Web Elements
영상에서는 먼저 우리가 일상적으로 마주치는 웹 경험을 이야기한다. <br>
쿠키 배너, 뉴스레터 팝업, 로그인 유도 창, 웹 푸시 알림, Cloudflare, CAPTCHA같은 로봇이 아님을 증명해야하는 클릭 버튼 등등. <br>
이런 요소들은 모두 사용자의 클릭을 요구한다. 인스타그램 같은 경우에서도, 쿠키에 대해 묻고, 로그인을 해야 컨텐츠를 볼 수 있다고 뜬다. 이런것들도 사용자에게 클릭을 강제한다고 볼 수 있다. <br>

### Browser Extension
브라우저의 확장 프로그램을 얘기한다. Chrome에서 각종 서비스를 보다 편하게 사용할 수 있게 우리는 확장 프로그램을 설치하곤 한다.
![확장프로그램 Chrome 웹스토어](/assets/img/posts/Conference_Clickjacking/Chrome_Extension_Store.png) <br>
우리는 이곳에서, 각종 확장 프로그램을 다운받고
![확장 프로그램 Chrome](/assets/img/posts/Conference_Clickjacking/chrome_extension.png)<br>
여기서 클릭하여 다운받은 확장 프로그램을 실행하거나 볼 수 있다. <br>


### 왜 브라우저 확장 프로그램인가?
발표에 의하면, Marek Tóth는 웹사이트가 아니라, 사용자의 브라우저 확장 프로그램을 주시하고 있었다. <br>
브라우저 확장 프로그램은 일반 웹 애플리케이션과 다르게 동작한다. 확장 프로그램은 백그라운드 스크립트, 콘텐츠 스크립트, 페이지 DOM과 상호작용하며, 사용자가 어떤 사이트에 있든 특정 기능을 제공할 수 있다.<br>
![브라우저 확장 프로그램 동작 구조](/assets/img/posts/Conference_Clickjacking/DEFCON_Browser_extension_structure.png)
<br>
그 중, 영상에서 다룬 프로그램은 비밀번호 관리자 확장 프로그램이다. <br>
<br>
비밀번호 관리자 확장 프로그램은 사용자의 로그인 정보, 개인 정보, 신용카드 정보, 때로는 TOTP나 패스 키 인증 흐름까지 다룬다. 확장 프로그램이기 때문에 웹 사이트의 하나의 세션을 넘어 브라우저 전반에서 작동하며, 사용자가 어느 페이지에 있든 자동 입력 UI를 띄울 수 있다. 편리성을 추구하다가, 보안관점에서는 민감한 부분인것이다. <br>

# 3. 클릭재킹 공격
## 3-1. iframe 기반 확장프로그램의 클릭재킹
첫번째 유형은 iframe 기반 공격이다. 이는 기존 웹 클릭재킹과 유사하지만, 대상이 브라우저 확장 프로그램의 페이지라는 점이다.
<br>
확장 프로그램의 manifest.json에는 `web_accessible_resources`라는 설정이 있다. 이 설정에서는 외부 웹페이지에서 접근 가능한 확장 프로그램 리소스를 정의한다. 설정이 과도하게 열려있거나, 특정 HTML 파일이 외부 도메인에서 iframe으로 불러올 수 있게 되어있다면 공격자는 이를 악용할 수 있다. <br>

예시로, 공격자가 확장 프로그램의 `app.html`을 자신의 페이지에 iframe으로 불러오고, 이를 투명하게 만든 뒤 Cloudflare 챌린지처럼 보이는 UI를 덮어 씌우는 방식이다. 사용자는 퍼즐이나 인증 절차를 수행한다고 생각하지만, 실제로는 비밀번호 관리자 UI를 조작하게 된다. <br>
이 공격의 결과는 비밀번호 관리자 확장 프로그램이 저장한 로그인 정보, 개인 정보, 신용카드 정보 등이 공격자에게 공유될 수 있으며 심지어 사용자는 정보를 보냈다는 사실 조차 인지하지 못한다. <br>
완화책은 명확하다. Manifest V2과는 다르게 V3에는 "matches:" 속성이 있으며, 새 사이트에서 접근이 가능한 도메인과 리소스를 매치 속성으로 설정할 수 있다. 확장 프로그램 개발자는 `web_accessible_resources`에 필요한 파일만 포함해야하고, `matches`설정으로 도메인을 제한해야 한다. <br>

## 3-2. DOM 기반 확장프로그램의 클릭재킹
영상에서 말하고자 하는 클릭재킹의 핵심이라고 말할 수 있었다.<br>
<br>
DOM 기반 공격에서는 iframe이 필요하지 않다. 브라우저 확장 프로그램이 웹 페이지 DOM에 주입한 UI요소를 공격자가 악성 스크립트로 조작한다. <br>
이 방식은 비밀번호 관리자 확장 프로그램이 DOM에 삽입하는 UI를 JavaScript로 보이지 않게 만드는 클릭재킹 기법이다. 영상에서 테스트한 비밀번호 관리자 확장 프로그램은 다음과 같으며 11개이다. <br>

- 1Password
- Bitwarden
- Dashlane
- Enpass
- iCloud Password
- Keeper
- LastPass
- LogMeOnce
- NordPass
- ProtonPass
- RoboForm

<br>
11개의 비밀번호 관리자 확장 프로그램 모두 기본 설정에서 DOM기반 확장프로그램 클릭재킹 공격에 취약한 것으로 보고되었고, 약 4천만 설치 사용자가 영향을 받을 수 있다고 설명했다. <br>
<br>

### 기본적인 동작 순서
공격자는 먼저 쿠키 배너나 CAPTCHA 처럼 보이는 요소를 만든다. 동시에 페이지 안에 이름, 이메일, 주소, 신용카드 정보 등 민감한 정보등을 받을 수 있는 숨겨진 폼을 준비한다. <br>
이후 입력 필드에 `focus()`를 주어, 비밀번호 관리자의 자동 입력 UI가 뜨게 만들고, 그 확장프로그램의 UI를 투명하게 바꾼다. <br>
투명하게 만드는 이유는 사용자가 '쿠키 수락', '쿠키 거부', 'Cloudflare의 챌린지 체크박스'같은 특정한 부분을 클릭할때, 사용자가 실제로 클릭하게 되는것은 이미 투명해진 비밀번호 관리자의 '자동완성' 기능이 되는 것이다. <br>
그 결과 확장프로그램이 저장한 정보는 공격자가 만든 폼에 채워지고, 공격자는 이 값을 서버로 전송할 수 있다. <br>

### 공격 변형 분류
#### 1. 루트와 자식 요소
확장 프로그램이 삽입한 루트 요소나 자식 요소의 불투명도를 조작하는 방식이다. (element를 요소라고 부른다) <br>
`document.querySelector("protonpass-root").style.opacity = 0.5;`
예시 스크립트이며, 이런식으로 opacity로 불투명도를 조작할 수 있다. <br>

Shadow DOM이 열려있는 경우에는 내부 iframe이나 자식 요소를 찾아서 스타일을 조작할 수 있다. <br>
* Shadow DOM은 독립적인 DOM트리를 생성할 수 있게 해주는 웹 표준이자, 웹 컴포넌트의 핵심적인 기술 중 하나이다. 
<br>

#### 2. 부모 요소
부모 요소인 `body`나 `html`의 투명도를 조작하는 방식이다. 페이지 전체를 투명하게 만들고 배경 이미지를 덧씌워서 정상적인 웹페이지처럼 보이게 하는 식이다. 다만 `html` 전체를 투명하게 만드는 방식은 사용자가 빈 페이지를 보게 될 수 있어 실용성이 떨어질 수 있다. <br>
`document.body.style.opacity=0.2;`처럼 투명도 조절, 빈 페이지일땐 `document.documentElement.style.backgroundImage = url("website.png");`처럼 다른 이미지 파일을 올려 커버할 수 있다. <br>
일단 사용자를 클릭하게 만드는 것이 공격자의 목표이기 때문이다. <br>

#### 3. 오버레이
오버레이를 이용하는 방식이다. Partial Overlay(부분 오버레이)와 Full Overlay(전체 오버레이)가 있다. <br>
부분 오버레이는 확장 프로그램 UI주변에 가짜 버튼이나, 닫기 버튼을 배치하여 사용자가 특정 지점을 클릭하도록 유도한다. `<div>`태그로 체크모양이나 'X'닫기 버튼을 만들어 클릭을 유도하는 방법이다. <br>
전체 오버레이는 `pointer-events: none`을 사용하는 방법이다.<br>
`pointer-events: none`을 사용하면 화면 위의 가짜 요소는 클릭을 받지 않고, 통과되어 그 아래의 확장 프로그램 UI가 클릭이 될 수 있다. Popover API를 활용하여 최상위 레이어에 가짜 UI를 띄우는 방식도 있다. <br>
#### 4. Position
포지션에 따른 분류인데, 쿠키배너, '닫기'나 CloudFlare 챌린지를 이용하여 특정한 위치를 클릭하게 하는 방법도 있으며, 확장 프로그램의 UI가 마우스 커서를 따라다니게 만드는 종류의 기법도 존재한다. <br>

# 4. 영향 (Impact)
이 확장프로그램을 이용한 클릭재킹 공격이 위험한 이유는 피해 범위가 단순한 로그인 폼에 한정되지 않기 때문이다. <br>
공격자 소유 웹사이트에서는 비밀번호 관리자에 저장된 신용카드 번호, 만료일, 보안 코드, 이름, 이메일, 전화번호, 주소 같은 개인정보를 탈취할 수 있다. 이런 데이터는 특정 도메인에 묶여있지 않기 때문에 임의의 웹사이트에서도 자동 입력될 수 있다. <br>
<br>

심지어 웹 사이트에 XSS, 서브도메인 탈취, 웹 캐시 포이즈닝 같은 취약점이 있다면 영향은 더 커진다. 이 경우 공격자는 신뢰된 도메인에서 JavaScript를 실행할 수 있고, 도메인의 로그인 자격증명까지 탈취할 수 있다. <br>
심지어 동일한 도메인 환경 뿐만 아니라, 서브 도메인 또는 상위 도메인에도 공격자가 피해자의 정보를 채워넣을 수 있다. <br>
또한 흔히들 안전하다고 생각되는 TOTP(시간 기반 일회용 비밀번호)까지 함께 저장한 사용자의 경우 2차 인증 코드조차 노출되어버릴 수도 있다. <br>
<br>

# 5. 탐지와 한계
### 탐지 방법: 
공격자는 모든 비밀번호 관리자를 하나의 스크립트로 감지할 수 있다. <br>
새로운 폼, 비밀번호 입력에 focus()를 사용하고 DOM이 무엇인지 체크하는 부분이 있는지 확인해보는 것만으로도 Password Manager를 쓰는지 확인할 수 있다. <br>

### 한계: 
DOM기반 클릭재킹도 결국 유저가 도메인에 자신의 정보를 저장해 놓아야하며, 사용자로부터 클릭을 받아내야 Clickjacking 공격이 시작된다.

### 그 외 이야기: 
Password Manager 확장 프로그램들에는 자동 로그아웃 기능이 있다. 비활성 시간, 흔히 말하는 컴퓨터를 켜놓고 어디 이동한다던지, 동작이 없는 시간이 길어지면 로그아웃되거나 잠금이 된다. <br>
하지만 iCloud Password같은 경우 잠금이 걸려도 Auto-Filled 기능이 여전히 사용이 가능하다는 취약점이 있었다. <br>

# 6. 취약점 완화 방법
- Extension 프로그램의 Root Element
    - 스타일을 변경하지 못하게 막아야한다. <br>
    공격자가 확장 프로그램이 삽입한 UI요소의 스타일을 바꿀수있다면, `opacity:0`같은 방식으로 UI를 보이지 않게 할 수 있다. <br>
    - closed Shadow DOM <br>
    Shadow DOM을 사용할 경우 페이지 스크립트가 내부 요소에 접근할 수 있기에 닫아 두는 것이 좋다.
- Parent Element
    - Body/HTML Opacity detection <br>
    확장 프로그램은 자신이 띄운 UI뿐 아니라 주변 DOM상태도 감시해야한다.
    - Popover API Detection<br>
    공격자가 Popover API를 사용하면 가짜 UI를 최상위 레이어에 띄워 실제 확장 UI를 가릴 수 있다. Popover 상태까지 고려해야한다.
- Partial Overlay
    - elementsFromPoint() <br>
    부분 오버레이에서는 elementsFromPoint()를 이용해 실제 클릭 지점에 어떤 요소들이 겹쳐 있는지 확인할 수 있다. <br> 
    Partial Overlay같은 경우, 각 요소들을 UI근처에 배치시켜 클릭을 유도하는 것이었으니, 확인하는 방식이 적합하다.
- Full Overlay
    전체 오버레이에서는 간단히 막을 수 있는 방법이 없다. 새로운 브라우저 API를 만드는 수준의 지원이 필요할 수 있다고 Marek Tóth는 말했다. <br>

# 7. 사용자가 취할 수 있는 방법
발표에서 제시되는 사용자 측 대응은 조금은 편리함을 감수하는 방법이었다. <br>
편리하진 않지만 권장되는 방법은, 자동 입력 UI를 비활성화하고, 필요한 경우 복사, 붙여넣기 방식으로만 사용하는 것이다. <br>
<br>
Chromium 기반 브라우저 사용자는 확장 프로그램의 사이트 접근 권한을 "On Click"으로 제한하는 방법도 고려할 수 있다. 이렇게 하면 확장 프로그램이 모든 사이트에서 항상 활성화 되는 것이 아닌, 사용자가 필요시에 클릭하고, 새로고침 후에 활성화가 된다. <br>
<br>

# 8. 리뷰
나는 영상을 찾아보며, 클릭재킹에 대해 확인할때 Reddit에서는 클릭재킹이 2006년, 2009~2010년에 주로 나타났던 취약점이라는 정보를 확인했다. <br>
이 오래된 공격 기법이 2025년 8월의 컨퍼런스 영상으로 나왔다는 것은 그저 "클릭재킹"이라는 공격 기법이 아직 존재한다 뿐만 아니라 오래된 공격 기법도 시대가 흐르고 환경이 바뀌면서 다시 유효해질 수 있다는 점을 의미하는 것 같았다. <br>
과연 확장 프로그램의 개발자들이 클릭재킹의 공격 기법 자체를 몰랐을까? 내 생각엔 존재의 유무는 알고 있었을 거라 생각한다. 그저, 오래됐기에 경계심이 줄었을 것이고 어떻게 응용되었을지 상상하진 못했을거라 생각한다. <br>
현대의 웹 서비스에서 무조건 클릭해야 콘텐츠를 보여주는 환경 속에서 `X-Frame-Options`, CSP, SameSite Cookie같은 간단한 방어책이 보편화된 clickjacking을 떠올리고, 확장 프로그램과 함께 연결시켜 공격 모델로 만들었다는 점이 흥미로웠다. <br>

# 9. 참고문헌
<a href="https://owasp.org/www-community/attacks/Clickjacking" target="_blank">https://owasp.org/www-community/attacks/Clickjacking</a> <br>
<a href="https://www.youtube.com/watch?v=Gu4IoDXNqoU&t=731s" target="_blank">https://www.youtube.com/watch?v=Gu4IoDXNqoU&t=731s</a><br>
<a href="https://www.reddit.com/r/webdev/comments/1dkt3vt/anyone_knows_the_clickjacking_vulnerabilities_and/?tl=ko" target="_blank">https://www.reddit.com/r/webdev/comments/1dkt3vt/anyone_knows_the_clickjacking_vulnerabilities_and/?tl=ko</a><br>