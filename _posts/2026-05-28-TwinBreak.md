---
layout: post
title: "TwinBreak 논문 리뷰"
date: 2026-05-28 00:00:00 +0900
category: 논문/컨퍼런스
---

# 0. 논문을 읽기 전에
## 0-1. 논문 제목 및 학회명

| 항목 | 설명 |
|:----:|:--------------:|
| 논문 제목 | TwinBreak: Jailbreaking LLM Security Alignments based on Twin Prompts |
| 저자 | Torsten Krauß, Hamid Dashtbani, Alexandra Dmitrienko |
| 학회 | 34th USENIX Security Symposium |
| 논문 링크 | https://www.usenix.org/conference/usenixsecurity25/presentation/krauss |

## 0-2. 논문을 고른 이유

이 논문을 고른 이유는 "모델 내부 구조와 파라미터 수준에서 안전장치가 제거될 수 있는지" 알아보는 문제를 다루기 때문이다. <br><br>
최근 LLM은 우리의 일상속에 완전히 자리잡았다고 할 수 있다. 번역, 코드 생성, 문서 작성, 각종 궁금증 해결 등 다양한 분야에서 사용되고 있다. 하지만 LLM이 위험한 요청에 대해 답변할 수 있다면, 피싱 이메일 작성, 악성 행위 지원, 위험한 정보 제공 같은 방식으로 악용될 가능성이 있다. <br><br>
심지어 오픈소스 LLM이 늘어나는 상황속에서, 모델을 직접 다운로드해서 실행할 수 있다면 white-box threat model이 단순한 가정이 아닌 실제 상황이 올 수도 있다는 생각 때문이었다.

## 0-3. 핵심 요약

이 논문은 LLM의 safety alignment가 단순히 프롬프트로만 우회되는 것이 아니라, 모델 내부 파라미터 수준에서도 약화될 수 있음을 보여준다. 저자들은 harmful prompt와 harmless prompt를 거의 같은 구조로 만든 TwinPrompt를 사용해 모델 내부 activation 차이를 비교하고, safety mechanism과 관련된 parameter를 찾아 pruning하는 TwinBreak를 제안한다. <br>

내가 보기에 이 논문의 핵심 기여는 jailbreak 성공률 자체보다, LLM의 안전장치가 모델 내부에서 분리 가능한 취약점처럼 분석될 수 있음을 보였다는 점이다. 특히 오픈소스 LLM이 늘어나는 상황에서는 외부 필터만으로는 충분하지 않고, safety alignment가 모델 내부에 더 강하게 통합되어야 한다는 문제의식을 던진다.

---

# 1. Introduction
## 1-1. LLM의 확산과 사회적 위험
저자는 먼저 머신러닝과 LLM이 빠르게 발전하고 있으며, 실제 사회에서 유용하게 쓰이고 있다는 점에서 논의를 시작한다. LLM은 번역, 질의응답, 코드 생성, 문서 작성 등 다양한 작업을 수행할 수 있고, ChatGPT와 같은 챗봇을 통해 일상생활에도 깊게 들어왔다고 설명한다. <br>
하지만 저자가 강조하는 것은 LLM의 유용성만이 아니다. <br>
LLM은 대규모 인터넷 텍스트를 학습하기 때문에, 유용한 지식뿐 아니라 위험하거나 부적절한 정보도 학습했을 가능성이 있다. 이 때문에 악의적인 사용자가 LLM을 이용해 피싱 이메일 작성, 불법 행위 관련 정보 요청, 위험한 지식 획득 등에 활용할 수 있다는 문제가 생긴다. <br>

## 1-2. 안전 정렬(Safety Alignment)의 역할

이를 방지하기 위해 LLM에는 위험한, 부적절한 프롬프트(harmful prompt라고 하자)를 거절하도록 하는 안전 정렬(safety alignment)이 적용된다. <br>
가장 핵심적인 기능은 harmful prompt를 거절하는 것이다. 사용자가 위험한 요청을 하면, 모델은 실제 정보를 제공하지 않고 거절 응답을 해야한다. <br>
저자는 safety alignment가 단순한 외부 필터가 아니라, 모델 자체에 포함된 기능이어야한다고 본다. 오픈 소스 LLM 때문이다. 모델이 공개되어 사용자가 직접 다운로드 할 수 있다면, 외부 필터나 API 수준의 제한은 제거될 수 있다. 따라서 안전 기능은 모델 내부에 학습되어 있어야 한다. <br> 

## 1-3. Jailbreak

저자는 safety alignment가 적용되어도 이를 우회하는 jailbreak 기법들이 등장했다고 한다. jailbreak는 LLM이 원래 거절해야 할 요청에 답하게 만드는 공격이다.
<br>
저자는 기존 탈옥(jailbreak) 방법을 black-box와 white-box로 나누어 설명한다. <br>

### Black-box Jailbreak
Black-box jailbreak는 공격자가 모델 내부를 볼 수 없고, 프롬프트 입력과 출력만 볼 수 있을때를 말한다. 따라서 공격자는 prompt engineering을 통해 모델을 속이려 한다. 예를 들어 질문을 우회적으로 바꾸거나, 역할극을 시키거나, 특정 jailbreak template을 붙이는 방식이다. <br>
Black-box 방식은 모델 내부의 safety alignment는 그대로 둔 채, 프롬프트를 교묘하게 만들어 모델이 거절하지 않도록 유도한다. 하지만 한계는 다음과 같다. <br>

1. 수작업이 많이 필요하다.
2. 계산 비용이 커질 수 있다.
3. 안전 정렬 자체를 제거하지 못한다. 

### White-box Jailbreak
White-box jailbreak는 공격자가 모델 내부 구조와 파라미터에 접근할 수 있다. 오픈소스 LLM을 다운로드한 상황이 대표적이다. <br>
공격자는 activation을 분석하거나, 파라미터를 수정하거나, fine-tuning 또는 pruning을 통해 안전 기능을 제거하려 할 수 있다. <br>
white-box 방식 또한 계산 비용이 크거나, 모델의 일반 성능을 손상시킬 위험이 있다. <br>

<br>
이 논문은 이러한 한계를 해결하기 위해 TwinBreak를 제안한다. 저자들은 LLM의 safety alignment를 특정 harmful input에 의해 활성화되는 backdoor-like mechanism으로 보고, 해로운 프롬프트와 해롭지 않은 프롬프트의 activation 차이를 비교하여 safety 관련 파라미터를 식별한다. <br>
특히 두 prompt가 문법 구조와 내용 면에서 최대한 유사하도록 구성된 twin prompt를 사용함으로써, safety mechanism과 관련된 activation 차이를 더 정밀하게 찾고자 한다. <br>

정리하면, 이 논문은 "LLM이 위험한 답변을 할 수 있다"는 문제를 넘어서 "모델 내부에 학습된 안전 장치가 white-box 환경에서도 견고한가"를 묻는 논문이라고 볼 수 있다. <br>

---

# 2. State of the Art

기존 jailbreak 연구는 크게 black-box jailbreak, white-box prompt generation, white-box model manipulation으로 나눌 수 있다.

## 2-1. Black-Box Jailbreak
모델 내부를 볼 수 없는 상황에서 프롬프트만 조작하는 방식이다. 실제 서비스형 LLM에서 black-box 환경이 흔하기 때문에 가장 현실적인 공격 방법이나 안전장치를 제거하는 것은 아니다. 특정 prompt에서는 모델의 답변을 우회할 수는 있으나, 조금만 달라져도 다시 거부당할 수 있다. <br>
즉, 문을 부수는 것 보다는 경비원을 속여서 이번 한 번만 문을 열게 하는 것에 가깝다고 말할 수 있다. <br>

## 2-2. White-box automatic prompt generation
white-box 환경에서 모델 내부의 activation, gradient 정보를 이용하여 jailbreak prompt를 자동으로 찾는 방식이다. 2-1의 방법보다는 체계적이지만, gradient 계산이나 반복 최적화가 필요해서 계산 비용이 크고 auxiliary model 이나 large dataset이 필요할 수 있다. 일부 방식은 생성된 prompt가 부자연스러울 수 있어서 탐지되기도 싶고, 실제 사용성도 떨어질 수가 있다. <br>
이 방식 또한 마찬가지로 safety alignment를 제거하는 것이 아닌 우회적인 방법이다. <br>

## 2-3. White-box model manipulation
White-box model manipulation은 모델 내부 구조와 파라미터에 직접 접근하여 safety alignment를 약화시키거나 제거하려는 방식이다. <br>
기존 방식은 크게 fine-tuning, activation 조작, pruning으로 나눌 수 있다.<br>
Fine-tuning 방식은 harmful prompt에 답하도록 모델을 추가 학습시키지만, 모델 전체 파라미터에 영향을 주기 때문에 일반 언어 능력까지 손상시킬 수 있다.<br>
Activation 조작 방식은 refusal response와 관련된 내부 activation 방향을 찾아 이를 약화시키지만, 여러 layer에 걸쳐 조작이 필요하고 그 원리가 항상 명확한 것은 아니다.<br>
<br>

Pruning 방식은 TwinBreak와 가장 가까운 접근이다. Safety alignment에 관여한다고 판단되는 파라미터를 제거해 모델이 harmful prompt를 거절하지 않도록 만드는 방식이다.<br>
하지만 기존 pruning 방식은 safety parameter와 utility parameter를 정확히 구분하기 어렵다. 일반 언어 이해와 응답 생성에 중요한 파라미터까지 제거하면 모델 성능이 크게 떨어질 수 있다.<br>
<br>
TwinBreak는 harmful prompt와 harmless prompt의 비교하는 방식에 차별점이 있다. 기존 연구들도 두 종류의 prompt를 사용할 수 있지만, 두 prompt가 충분히 유사하지 않으면 activation 차이가 safety mechanism 때문인지 단순한 주제 차이 때문인지 구분하기 어렵다. TwinBreak는 이 문제를 해결하기 위해 문장 구조와 내용이 거의 같은 harmful/harmless twin prompt를 사용한다.<br>

## 2-4. Backdoor / pruning 기반 연구

TwinBreak의 핵심 관점은 LLM의 safety alignment를 backdoor와 유사하게 보는 것이다. Backdoor는 특정 trigger가 들어왔을 때 모델이 평소와 다른 출력을 내도록 만드는 숨겨진 기능이다.
이 관점에서 harmful prompt는 safety mechanism을 작동시키는 trigger처럼 볼 수 있다.<br>
이러한 관점에서 저자들은 backdoor defense에서 사용되던 targeted pruning 아이디어를 LLM safety alignment 제거에 적용한다. Harmful prompt와 harmless twin prompt를 각각 입력하고, 두 입력의 activation difference가 큰 파라미터를 safety-related parameter 후보로 본다. 이후 모델의 일반 기능에 중요한 utility parameter를 제외한 뒤 pruning한다.<br><br>

---

# 3. Methodology

## 3-1. 핵심 아이디어
결국, TwinBreak의 핵심 아이디어는 "비슷한 두 입력의 차이"를 이용해서 safety alignment와 관련된 파라미터를 찾는 것이다. <br>

예를 들어 harmless prompt가 들어오면 모델은 정상적으로 답변하지만, harmful prompt가 들어오면 모델은 refusal response를 생성한다. 저자들은 이 차이가 모델 내부 activation에도 반영된다고 보고, harmful prompt와 harmless prompt의 activation difference를 분석해 safety-related parameter를 찾으려 한다.<br><br>

즉, TwinBreak는 safety alignment를 단순히 prompt 수준에서 우회하는 것이 아니라, 모델 내부에서 safety mechanism에 관여하는 파라미터를 찾아 pruning하는 방식이다.<br><br>

## 3-2. TwinPrompt Dataset

저자들은 safety-related parameter를 더 정밀하게 찾기 위해 TwinPrompt라는 데이터셋을 만든다. TwinPrompt는 harmful prompt와 harmless prompt가 1:1로 대응되는 100개의 twin prompt pair로 구성된다.<br><br>

이 데이터셋은 HarmBench를 기반으로 만들어졌으며 각 harmful prompt에 대응하는 harmless prompt를 수작업으로 작성되었다. 이때 중요한 점은 두 prompt의 문법 구조와 내용이 최대한 유사해야 한다는 것이다.<br>

그 이유는 activation difference를 safety mechanism과 연결하기 위해서다. 만약 harmful prompt와 harmless prompt가 전혀 다른 주제를 다룬다면, 두 입력의 activation 차이가 safety 때문인지 단순한 주제 차이 때문인지 알 수 없다. 반대로 두 prompt가 거의 같은 구조를 가지고 있고 위험성만 다르다면, activation 차이는 safety mechanism과 더 관련 있을 가능성이 높다.<br><br>

## 3-3. Activation Difference를 이용한 Safety Parameter 식별

TwinBreak는 twin prompt pair를 모델에 입력하고, 선택된 layer에서 activation을 수집한다. 전체 응답을 생성하지 않고 첫 번째 output token을 생성하는 과정에서 activation을 분석한다.<br> 이미 프롬프트가 유사하기 때문에, 모델 내부에서 다르게 반응하는 부분이 있다면 그 부분이 safety mechanism과 높은 연관이 있을 수 있다고 보는 것이다. <br>

## 3-4. Utility Parameter Exclusion

TwinBreak는 activation 차이가 크다고 해서 해당 parameter를 바로 제거하지 않는다. 어떤 parameter는 safety alignment뿐 아니라 모델의 일반적인 언어 이해와 응답 생성 능력에도 중요할 수 있기 때문이다. 이런 parameter를 잘못 제거하면 모델이 정상적으로 작동하지 않을 수 있다.<br><br>

이를 막기 위해 저자들은 utility parameter를 별도로 식별하고, pruning 대상에서 제외된다. 위험하지 않은 prompt들 사이에서 반응 차이가 큰 부분은 일반적인 언어 이해나 응답 생성에 중요한 기능을 할 것이라고 판단하는것이다. 

## 3-5. Iterative Targeted Pruning

TwinBreak는 safety-related parameter를 한 번에 많이 제거하지 않고, 여러 번에 나누어 pruning한다. 기본 설정은 5번의 pruning iteration이며, 각 iteration에서 activation difference가 큰 상위 1% parameter를 pruning한다.<br><br>

왜냐하면 safety mechanism이 한번에 드러나지 않을 수 있고, 다른 부분을 먼저 지운 뒤에야 두드러질 수 있기에 조금씩 반복해서 지우는 방법을 행하는 것이다.

## 3-6. Inference Strategy

TwinBreak는 pruning된 모델만으로 전체 응답을 생성하지 않는다. 저자들은 pruned model을 사용해 응답의 초기 50 tokens를 생성한 뒤, 나머지 응답은 원래의 모델로 생성한다.<br><br>

이 전략은 safety refusal이 주로 응답 초기에 발생한다는 관찰에 기반한다. 모델이 처음에 거절하면 끝까지 거절 흐름으로 가지만, 처음에 pruned model로, 안전장치가 약화된 모델로 시작하고 난 뒤엔 일반 답변으로 시작한다면 원래 모델로 바꾸어도 거절 흐름이 켜질 가능성이 적다고 보는 것이다. 또한, 일반적으로 가지고 있는 모델의 성능도 지켜질 수 있다고 보는 것이다. <br><br>



---

# 4. Results

## 4-1. 평가 목적

저자들은 TwinBreak가 실제로 LLM의 safety alignment를 제거할 수 있는지 평가한다. 실험에서 확인하려는 핵심은 네 가지이다.<br><br>

첫째, TwinBreak가 harmful prompt에 대한 refusal response를 줄이고 attack success rate를 높일 수 있는가.<br>
둘째, TwinPrompt에 포함되지 않은 새로운 harmful prompt에도 일반화되는가.<br>
셋째, 특정 모델에만 작동하는 것이 아니라 여러 LLM에서 작동하는가. <br>
넷째, safety alignment를 제거하는 과정에서 모델의 일반 utility가 크게 손상되지 않는가.<br><br>

즉, 저자들은 TwinBreak가 단순히 한 데이터셋이나 한 모델에만 맞춘 공격이 아니라, 여러 모델과 benchmark에서 반복적으로 작동하는 방법임을 보이고자 한다.<br><br>

## 4-2. 평가 대상 모델과 데이터셋

저자들은 LLaMA, Gemma, Qwen, Mistral, DeepSeek 계열 모델을 포함해 총 16개의 LLM을 대상으로 실험했다. 모델 크기도 1B부터 72B까지 다양하게 포함하여, TwinBreak가 특정 크기나 특정 vendor에만 의존하지 않는지 확인했다.<br><br>

평가 데이터셋으로는 HarmBench, AdvBench, JailbreakBench, StrongREJECT가 사용되었다.<br> HarmBench는 TwinPrompt를 만들 때 기반이 된 데이터셋이며, 저자들은 일부를 TwinPrompt 구성에 사용하고 나머지를 validation에 사용했다.<br> AdvBench와 JailbreakBench는 기존 jailbreak 연구에서 자주 사용되는 harmful prompt benchmark이고, StrongREJECT는 단순히 거절 여부만 보는 것이 아니라 응답의 구체성과 유효성까지 평가하기 위해 사용되었다.<br><br>

## 4-3. 주요 결과: 높은 ASR

주요 평가 지표는 ASR, 즉 Attack Success Rate이다. ASR은 harmful prompt를 입력했을 때 모델이 거절하지 않고 유해한 응답을 생성한 비율을 의미한다.<br><br>

실험 결과, TwinBreak는 여러 모델과 데이터셋에서 높은 ASR을 보였다. 대표적으로 HarmBench validation 기준으로 LLaMA 2 7B는 94%, LLaMA 3.1 8B는 99%, Qwen 2.5 7B는 97% ASR을 보였다. <br><br>

AdvBench와 JailbreakBench에서도 비슷하게 높은 ASR을 보였고, StrongREJECT에서도 높은 평균 점수를 기록했다. 이는 TwinBreak가 단순히 refusal을 피하는 데 그치지 않고, 여러 평가 기준에서 safety alignment를 약화시키는 효과를 보였다는 의미로 해석할 수 있다. <br><br>

## 4-4. 일반화 성능

결과적으로 TwinBreak는 pruning에 사용되지 않은 prompt에서도 높은 ASR을 보였다. 저자들은 이를 통해 TwinBreak가 특정 prompt를 암기하거나 특정 데이터셋에만 과적합된 것이 아니라, safety alignment와 관련된 일반적인 내부 parameter를 제거했다고 주장한다.<br><br>

조금 더 쉽게 말하자면, 단순히 TwinPrompt를 외운것이 아니라 safety mechanism 자체가 약화되었다고 볼 여지가 생긴 것이다.

## 4-5. Utility 평가

TwinBreak가 안전장치를 지우려다가 일반 성능까지 손상시키면 안되기에 저자들은 TwinBreak가 모델의 일반 성능을 얼마나 손상시키는지도 평가했다. 이를 위해 OpenBookQA, ARC-Challenge, HellaSwag, RTE, WinoGrande 같은 일반 LLM benchmark를 사용했다.<br><br>

결과적으로 pruning iteration이 증가할수록 utility가 약간 감소하는 경향은 있었지만, 전체적으로 큰 손상은 아니었다고 보고한다. 

저자들은 이를 TwinBreak가 safety-related parameter를 비교적 정밀하게 제거했기 때문이라고 해석한다. 특히 utility parameter를 사전에 식별해 pruning 대상에서 제외한 것이 모델 성능 유지에 중요했다고 본다.<br><br>

| 평가 관점 | 확인한 내용 | 결과 해석 |
|:---:|:---|:---|
| 공격 성공률 | HarmBench, AdvBench, JailbreakBench, StrongREJECT에서 ASR 측정 | 여러 모델에서 높은 ASR을 보여 safety alignment가 약화됨 |
| 일반화 | TwinPrompt에 없는 unseen prompt로 평가 | 특정 prompt 암기가 아니라 safety mechanism 자체가 약화되었을 가능성 |
| 모델 범위 | LLaMA, Gemma, Qwen, Mistral, DeepSeek 등 16개 모델 사용 | 특정 모델에만 의존하지 않는다고 주장 |
| Utility | OpenBookQA, ARC-Challenge, HellaSwag 등으로 일반 성능 평가 | 일부 성능 저하는 있지만 비교적 제한적 |
| 비교 실험 | Directional Ablation, Set Difference와 비교 | TwinBreak가 더 빠르고 높은 성능을 보였다고 보고 |




---

# 5. 한계점

## 5-1. White-box Threat Model의 한계

TwinBreak는 white-box threat model을 전제로 한다. 실제 우리가 주로 사용하는 서비스형 LLM은 black-box LLM이 많으며, 모델 내부를 볼 수 없어서 TwinBreak의 결과를 일반화 시키기는 어렵다.

## 5-2. TwinPrompt Dataset의 한계

TwinBreak의 핵심은 harmful prompt와 harmless prompt를 구조적으로 유사하게 만든 twin prompt이다. 하지만 TwinPrompt는 저자들이 수작업으로 구성한 100개의 prompt pair로 이루어져 있다. <br>
수작업으로 만들어졌기에 정말 유사하게 만들었는지 객관적인 판단이라는 전제 자체가 주관적일 수 있다. <br>

## 5-3. Safety Alignment가 정말 backdoor?

저자들은 safety alignment를 backdoor-like mechanism으로 해석한다. 이 관점은 TwinBreak의 핵심 아이디어이며, harmful prompt가 safety mechanism을 trigger한다는 설명은 직관적이다.<br><br>

하지만 safety alignment가 실제로 backdoor처럼 특정 파라미터 집합에 의해 작동한다고 단정하기는 어렵다. 모델마다 alignment 방식이 다를 수 있고, safety behavior가 여러 layer와 기능에 넓게 분산되어 있을 가능성도 있다. 따라서 이 가정은 실험적으로 효과를 보였지만, 모든 LLM에 대해 일반적인 원리로 확정되었다고 보기는 어렵다.<br><br>

## 5-4. 자동 평가기의 한계

논문은 ASR 평가를 위해 LlamaGuard3와 StrongREJECT evaluator를 사용한다. 이러한 자동 평가기는 많은 응답을 빠르게 평가할 수 있다는 장점이 있지만, harmfulness를 완벽하게 판단한다고 보기는 어렵다.<br><br>

## 5-5. 방어 기법의 구체성 부족

이 논문은 TwinBreak라는 공격 방법을 제안하고, 기존 safety alignment가 white-box 환경에서 취약할 수 있음을 보여준다. 그러나 이를 막기 위한 구체적인 방어 기법은 충분히 제시하지 않는다.<br><br>

## 5-6. 윤리적 고민

TwinBreak는 LLM safety alignment의 취약성을 보여준다는 점에서 보안 연구로서 의미가 있다. 하지만 동시에 safety alignment를 제거하는 방법을 다룬다는 점에서 악용 가능성도 존재한다.<br><br>

저자들은 이 연구가 LLM의 기존 위험을 새롭게 만든 것이 아니라, 이미 존재하는 위험을 드러내는 것이라고 설명한다. 그러나 코드와 데이터셋이 공개되는 경우, 방어 연구자뿐 아니라 악의적인 사용자도 이를 활용할 수 있다. 따라서 이런 연구는 공개 범위와 재현 가능성, 방어 목적의 안내 사이에서 신중한 균형이 필요하다고 생각한다.<br><br>

| 한계 | 핵심 내용 |
|:-----:|:---------:|
| White-box 조건 | 모델 내부 접근이 필요함 |
| Dataset 한계 | TwinPrompt가 100쌍, 수작업, 영어 중심 |
| 가정의 한계 | safety alignment를 backdoor처럼 보는 관점은 실험적 가정 |
| 평가 한계 | LlamaGuard3, StrongREJECT 같은 자동 평가기 의존 |
| 방어 부족 | 구체적인 defense 알고리즘은 없음 |
| 윤리 문제 | safety removal 연구의 악용 가능성 |

---

# 6. Conclusion

## 6-1. 논문의 핵심 정리

이 논문은 LLM의 안전장치가 단순히 프롬프트 수준에서만 다뤄질 문제가 아니라, 모델 내부 구조와 파라미터 수준에서도 중요한 보안 문제가 될 수 있다는 점을 보여준다. 기존 jailbreak 연구가 주로 프롬프트를 조작해 safety alignment를 우회하는 방식이었다면, TwinBreak는 모델 내부에서 safety alignment와 관련된 부분을 찾아 제거하려 한다는 점에서 더 근본적인 접근이라고 볼 수 있다.<br><br>

결국 TwinBreak 기법은 위험한 질문(harmful prompt)과 안전한 질문(harmless prompt)를 거의 똑같이 만들어 모델에 넣고 비교하며, 직접 내부의 동작이 어떻게 바뀌는지 확인한다. 위험한 질문에서 특히 반응하는 부분을 안전장치라고 가정하여 조금씩 조금씩 지워나가면서 모델의 기본 능력에는 영향을 최대한 덜 주며 약화시키는 것이다. <br>
결국에는 여러 모델에서도 이 기법을 이용하여 harmful prompt를 거절하는 능력이 많이 약해졌고, 일반 성능은 그렇게 망가지는 것은 아니라는 결과를 적은 것이다.

## 6-2. 종합 평가

TwinBreak의 가장 큰 의의는 LLM의 safety alignment가 모델 내부 파라미터 수준에서 분석될 수 있음을 보였다는 점이다. 기존 jailbreak 연구가 주로 prompt를 조작해 안전장치를 우회하는 데 집중했다면, TwinBreak는 safety alignment와 관련된 내부 parameter를 찾고 pruning한다는 점에서 더 근본적인 문제를 제기한다.

방법론 측면에서는 TwinPrompt의 설계가 핵심적이다. Harmful prompt와 harmless prompt를 거의 같은 구조로 만들었기 때문에, 두 입력 사이의 activation difference를 safety mechanism과 연결할 근거가 생긴다. 이는 기존 white-box jailbreak 방법들이 harmful/harmless input을 비교할 때 발생할 수 있는 주제 차이 문제를 줄이려는 시도라고 볼 수 있다.

다만 이 접근이 완전히 일반화되었다고 보기는 어렵다. TwinPrompt는 수작업으로 구성되었고 영어 중심이며, safety alignment를 backdoor-like mechanism으로 보는 가정도 모든 모델에 적용된다고 단정하기 어렵다. 또한 평가가 자동 evaluator에 의존한다는 점에서 실제 harmfulness 판단에는 추가 검증이 필요하다.

그럼에도 이 논문은 오픈소스 LLM 환경에서 중요한 보안적 의미를 가진다. 모델 내부 접근이 가능한 상황에서는 외부 필터만으로 안전성을 보장하기 어렵고, safety alignment가 모델 내부에 더 강하게 통합되어야 한다는 점을 보여준다.


## 6-3. 앞으로 더 읽어볼 논문

이 논문을 더 잘 이해하기 위해서는 먼저 기존 white-box jailbreak 연구를 더 읽어볼 필요가 있다고 생각한다. 특히 논문에서 비교 대상으로 등장한 Directional Ablation과 Set Difference 방식은 TwinBreak와 직접적으로 연결되는 연구이기 때문에, 이 논문들과 비교해보면 TwinBreak의 차별점이 더 명확해질 것 같다.<br><br>

또한 safety alignment와 refusal behavior를 분석하는 연구도 읽어보고 싶다. 모델이 왜 어떤 질문에는 답하고, 어떤 질문에는 거절하는지 내부적으로 분석하는 연구를 보면 TwinBreak의 가정이 얼마나 타당한지 더 잘 이해할 수 있을 것 같다.<br><br>

마지막으로 backdoor detection이나 pruning 관련 연구도 함께 읽어볼 만하다. TwinBreak는 safety alignment를 backdoor처럼 해석하고 pruning을 적용하기 때문에, 기존 backdoor 방어 연구를 이해하면 이 논문의 배경을 더 깊게 이해할 수 있을 것 같다.<br><br>

## 6-4. 논문에서 꼭 알아가야하는 것

1. TwinBreak는 prompt 기반 jailbreak가 아니다. model 내부를 들여다보고, model 내부 파라미터를 건드리며 제거하는 jailbreak 기법이다. 
2. 핵심 도구는 Twin Prompt라고 할 수 있다. 유해한 질문, 무해한 질문(harmful prompt / harmless prompt)를 유사하게 만들어서 어떻게 반응하는지 체크하는 것으로 안전장치를 찾아낸다. 
3. utility parameter는 보호한다. 모델 내부 파라미터를 건드리기에 잘못 삭제한다면 모델 자체의 성능이 떨어질 수 있다. 그건 안전장치를 약화시킨게 아니라 그냥 모델을 망가뜨리는것이라고 볼 수 있는데, TwinBreak 공격기법은 모델의 성능이 조금은 떨어지지만, 그렇게 많이 떨어지지않고 safety alignment만 없앨 수 있다는 점이 부각된다.
4. 결국 TwinBreak는 실제 흔히 서비스 되는 Black-box 기반 LLM이 아닌, white-box 환경에서 사용할 수 있는 기법이란것을 알아야한다. 그러면서도 모델 내부에 접근할 수 있다면 안전장치가 제거될수있다는 점을 말하며, 안전장치 설계에 힘을 써야하는것을 의미한다. <br>



# 용어 정리

| 용어 | 설명 |
|:---:|:------------------------------|
| LLM | Large Language Model의 약자로, 대규모 텍스트 데이터를 학습한 언어 모델이다. ChatGPT 같은 모델이 대표적인 예시이다. |
| Safety Alignment | 모델이 위험하거나 부적절한 요청에 대해 답하지 않도록 학습시키는 안전 정렬 과정이다. 쉽게 말해, 위험한 질문에 “답할 수 없다”고 거절하게 만드는 장치이다. |
| Harmful Prompt | 모델이 답변하면 위험할 수 있는 요청이다. 예를 들어 불법 행위, 악성 행위, 위험한 정보 생성을 요구하는 프롬프트가 여기에 해당한다. |
| Harmless Prompt | 위험하지 않은 일반적인 요청이다. TwinBreak에서는 harmful prompt와 구조는 비슷하지만 안전한 내용의 prompt를 의미한다. |
| Jailbreak | LLM이 원래 거절해야 할 요청에 답하도록 safety alignment를 우회하거나 약화시키는 공격이다. |
| Black-box | 모델 내부 구조나 파라미터를 볼 수 없고, 입력과 출력만 확인할 수 있는 상황이다. 일반적인 API 기반 LLM 사용 환경이 여기에 가깝다. |
| White-box | 모델 내부 구조, 파라미터, activation 등을 볼 수 있는 상황이다. 오픈소스 LLM을 직접 다운로드해 분석하는 경우가 대표적이다. |
| Parameter | 모델이 학습 과정에서 얻은 내부 값이다. 모델의 판단과 응답 생성에 영향을 주는 구성 요소라고 볼 수 있다. |
| Activation | 입력이 들어왔을 때 모델 내부에서 나타나는 반응값이다. 이 논문에서는 harmful prompt와 harmless prompt가 모델 내부에서 얼마나 다르게 반응하는지 보기 위해 사용된다. |
| Activation Difference | 두 입력을 넣었을 때 모델 내부 반응값이 얼마나 다른지를 나타낸 것이다. TwinBreak는 이 차이를 이용해 safety 관련 parameter를 찾는다. |
| Pruning | 모델의 특정 parameter나 neuron을 제거하거나 비활성화하는 방법이다. 이 논문에서는 safety alignment와 관련된 parameter를 약화시키기 위해 사용된다. |
| Utility | 모델의 일반적인 성능을 의미한다. 예를 들어 질문에 답하기, 문장 이해하기, 추론하기 같은 기본 능력을 말한다. |
| Utility Parameter | 모델의 일반 성능을 유지하는 데 중요한 parameter이다. TwinBreak는 이 부분을 제거하지 않도록 따로 보호한다. |
| ASR | Attack Success Rate의 약자로, harmful prompt에 대해 모델이 거절하지 않고 답변한 비율을 의미한다. |
| TwinPrompt | harmful prompt와 harmless prompt를 거의 같은 문장 구조로 만든 prompt 쌍이다. TwinBreak에서 safety 관련 activation 차이를 찾기 위해 사용된다. |
| Backdoor | 특정 trigger가 들어왔을 때 모델이 평소와 다른 출력을 내도록 만드는 숨겨진 동작이다. 이 논문에서는 safety alignment를 backdoor와 비슷한 구조로 해석한다. |
| Refusal Response | 모델이 위험한 요청에 대해 “도와줄 수 없다”는 식으로 거절하는 응답이다. |
| Fine-tuning | 이미 학습된 모델을 특정 목적에 맞게 추가로 학습시키는 과정이다. |
| Decoder-only Transformer | GPT 계열 LLM에서 많이 쓰이는 구조로, 이전 token들을 바탕으로 다음 token을 순차적으로 예측하는 방식의 모델 구조이다. |
| MLP Layer | Transformer 내부에서 정보를 변환하고 처리하는 부분 중 하나이다. 이 논문에서는 MLP의 Gate와 Up layer가 pruning 대상으로 사용된다. |
| Gate Layer | MLP 내부에서 어떤 정보가 다음 단계로 흘러갈지 조절하는 역할을 하는 부분이다. |
| Up Layer | MLP 내부에서 표현의 차원을 확장해 더 풍부한 정보를 처리하도록 하는 부분이다. |
| Down Layer | 확장된 표현을 다시 원래 크기로 줄이는 부분이다. TwinBreak에서는 기본 pruning 대상에서 제외된다. |
| Unseen Prompt | pruning이나 학습에 사용되지 않은 새로운 prompt이다. 논문에서는 TwinBreak가 unseen prompt에도 작동하는지 평가한다. |

# References
* Torsten Krauß, Hamid Dashtbani, and Alexandra Dmitrienko. **TwinBreak: Jailbreaking LLM Security Alignments based on Twin Prompts.** 34th USENIX Security Symposium, 2025.

관련 논문: 

* Mazeika et al. **HarmBench: A Standardized Evaluation Framework for Automated Red Teaming and Robust Refusal.** 2024.
  * TwinPrompt 데이터셋을 구성하는 기반이 된 harmful prompt benchmark이다.

* Zou et al. **Universal and Transferable Adversarial Attacks on Aligned Language Models.** 2023.
  * gradient 기반 jailbreak prompt 생성 연구로, 기존 white-box jailbreak 흐름을 이해하는 데 관련이 있다.

* Chao et al. **JailbreakBench: An Open Robustness Benchmark for Jailbreaking Large Language Models.** 2024.
  * LLM jailbreak 성능 평가에 사용되는 benchmark 중 하나이다.

* Souly et al. **A StrongREJECT for Empty Jailbreaks.** 2024.
  * 단순히 거절 여부만 보는 것이 아니라, harmful response의 구체성과 유효성을 평가하기 위한 benchmark이다.

* Arditi et al. **Refusal in Language Models is Mediated by a Single Direction.** 2024.
  * Directional Ablation 방식과 관련된 연구로, TwinBreak와 비교되는 white-box jailbreak 방법이다.

* Wei et al. **Assessing the Brittleness of Safety Alignment via Pruning and Low-Rank Modifications.** 2024.
  * pruning을 이용해 safety alignment의 취약성을 분석한 연구로, TwinBreak와 가장 가까운 기존 연구 중 하나이다.

* Wang et al. **Neural Cleanse: Identifying and Mitigating Backdoor Attacks in Neural Networks.** 2019.
  * backdoor를 탐지하고 pruning하는 연구로, TwinBreak가 safety alignment를 backdoor-like mechanism으로 해석하는 데 배경이 되는 연구이다.

* Touvron et al. **LLaMA 2: Open Foundation and Fine-Tuned Chat Models.** 2023.
  * TwinBreak 실험에서 사용된 대표적인 open-source LLM 계열이다.

* Meta AI Research. **The Llama 3 Herd of Models.** 2024.
  * TwinBreak 실험에서 사용된 LLaMA 3.1, LLaMA 3.3 계열 모델과 관련된 참고문헌이다.

* Vaswani et al. **Attention Is All You Need.** 2017.
  * Transformer 구조의 기반이 되는 논문으로, LLM의 decoder-only architecture를 이해하는 데 배경이 된다.
