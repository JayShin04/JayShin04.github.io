---
title: "디지털 포렌식 정리 01"
description: "비밀번호를 입력해야 열람할 수 있는 보호된 게시글입니다."
date: 2026-09-27T01:00:00Z
image: ""
categories: ["기록/학습"]
author: "JayShin04"
tags: ["학습","블로그"]
password: "MJSEC"
draft: false
---

# Corrupted Disk Image

## Dreamhack Wargame

![corrupted-disk-image-01](/images/digital-forensic-01/corrupted-disk-image-01_download.png)

먼저 Corrupted-disk-image-01을 준비한다.

![corrupted-disk-image-02](/images/digital-forensic-01/corrupted-disk-image-02_ftk_imager.png)

압축을 푼 뒤, ftk_imager에 E01파일을 넣고 열어보면

![corrupted-disk-image-03](/images/digital-forensic-01/corrupted-disk-image-03.png)

깨진 파일 하나 (unallocated space)가 보인다. 이것을 Export하여 HxD로 가져가보자.

![corrupted-disk-image-04](/images/digital-forensic-01/corrupted-disk-image-04.png)

HxD안에서 Export되었던 unallocated space를 열어주고

![corrupted-disk-image-05](/images/digital-forensic-01/corrupted-disk-image-05.png)

깨진 파일 맨 밑에 보면 마지막이 55AA로 끝나며 이것에 대해 찾아보게되면

![corrupted-disk-image-찾아보기](/images/digital-forensic-01/corrupted-disk-image-07.png)

55AA로 마지막에 끝나는 시그니처는, 컴퓨터 구조 및 디지털 포렌식에서 마스터 부트 레코드, 볼륨 부트 레코드 등 부트 섹터의 가장 마지막에 위치하는 부트 레코드 시그니처라고 한다.

![corrupted-disk-image-06](/images/digital-forensic-01/corrupted-disk-image-06.png)

자, 이제 부트 섹터 답게 맨 첫번째 섹션으로 올라가서 붙여주고 저장해준다음, FTK imager로 다시 열어주게된다면?

![corrupted-disk-image-08](/images/digital-forensic-01/corrupted-disk-image-08.png)
정상적으로 내부 파일이 열리게 되는 모습을 볼 수 있다. 이 안에서 우리는 필요한 파일을 찾아내야 한다.

![corrupted-disk-image-09](/images/digital-forensic-01/corrupted-disk-image-09.png)
root 안에 있는 내용 중에, DO NOT READ라는 파일이 있었으며, 내용은 DH{sha-256(keyfile)}이다. <br>
sha-256(keyfile) : python에서 코드 짜듯이 생각해본다면 keyfile을 sha-256 방식으로 해싱하라는 것으로 볼 수 있기에, keyfile을 먼저 열어본다.

![corrupted-disk-image-10](/images/digital-forensic-01/corrupted-disk-image-10.png)
영문과 숫자로 이루어진 무언가 긴 문자열이 있으며, 이것을 복사하여 hashcalc에서 sha-256으로 돌려보았다.

![corrupted-disk-image-11](/images/digital-forensic-01/corrupted-disk-image-11.png)
![corrupted-disk-image-12](/images/digital-forensic-01/corrupted-disk-image-12.png)

SHA-256으로 나왔던 문자열을 복사해서 DH{ } 로 감싼뒤 제출해주면, 문제가 풀리게 된다.

---

# Basic_Forensics_1

## Dreamhack Wargame

![basic-forensics-01](/images/digital-forensic-01/basic-forensics-01.png)

두번째로 풀 문제는 Basic_Forensics_1이다. 이 문제 설명이 모든 힌트가 되었다. <br>
<br>

#### 이미지 파일 안에 Hidden 메세지가 숨어있다.

곧장 구글에 검색해보자.

![basic-forensics-02](/images/digital-forensic-01/basic-forensics-02.png)
![basic-forensic-03](/images/digital-forensic-01/basic-forensics-03.png)
![basic-forensics-04](/images/digital-forensic-01/basic-forensics-04.png)

어라? 이미지 파일 안에 hidden 메세지가 숨어있다 라는 말과 <br>

스테가노 그래피의 "데이터나 메시지를 내부에 숨기는 기법"이라는 설명과 일치하는 것을 확인할 수 있다.

![basic-forensics-05](/images/digital-forensic-01/basic-forensics-05.png)

검색을 해서 들어온 결과, Steganography Encoding, Decoding사이트를 발견할 수 있었고, 곧장 Decode에 이미지를 넣어보았다.

![basic-forensics-06](/images/digital-forensic-01/basic-forensics-06.png)

![basic-forensics-07](/images/digital-forensic-01/basic-forensics-07.png)
디코딩된 hidden message에서 맨첫번째 줄에 DH{} 로 시작하는 플래그가 보이며, 그걸 곧바로 입력하게 되면 문제가 풀리는 것을 알 수 있었다.

---
