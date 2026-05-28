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

## [이 섹션에 대한 생각]
safety alignment를 우회하는 jailbreak 기법으로는 프롬프트에 의존하는 black-box기법에 대해서만 생각을 하고 있었는데, 처음에는 white-box 기법에 대해 소개할 필요가 있을까 싶었다. <br>
하지만 오픈 소스 LLM이 확산되는 상황에서는 white-box threat model이 아예 불가능한 것이 아니라는 생각이 들게 되었다. <br>

---

# 2. State of the Art

## 2-1. Black-Box Jailbreak
모델 내부를 볼 수 없는 상황에서 jailbreak 하는 방법을 의미한다. <br>
프롬프트 엔지니어링에 의존하는 방법이고, 실제 서비스형 LLM에서는 black-box 환경이 흔하기 때문에 현실적인 공격 방식이고, 한계가 명확하다. <br>
첫째, 효과적인 jailbreak prompt를 만들려면 사람이 여러 표현을 바꾸어 실험해야 할 수 있기에 수작업이 많이 필요하다. <br>
둘째, 반복적인 탐색이나 보조 모델이 필요할 수 있다. 자동화된 black-box jailbreak는 여러 번 모델을 호출하거나, 별도의 LLM을 사용해 공격 prompt를 생성해야 할 수 있다. <br>
셋째, safety alignment자체를 제거하지 못한다. black-box jailbreak는 특정 prompt에서 safety mechanism을 우회하기만 할 뿐, 모델 내부에 들어있는 safety alignment를 없애지 못한다. 다른 prompt에서는 여전히 거절 동작이 유지될 수 있다. <br>
<br>
즉, 문을 부수는 것 보다는 경비원을 속여서 이번 한 번만 문을 열게 하는 것에 가깝다고 말할 수 있다. <br>

## 2-2. White-box automatic prompt generation
white-box 환경에서 모델 내부 정보를 이용해 jailbreak prompt를 자동으로 생성하는 방식이다. <br>
White-box에서는 공격자가 모델 구조, activation, gradient 같은 내부 정보를 볼 수 있다. 따라서 단순히 프롬프트를 감으로 만드는 것이 아니라, 모델 내부 반응을 분석해 어떤 입력이 safety mechanism을 우회할지 찾을 수 있다. <br>

저자는 이 계열의 연구로 gradient 기반 suffix 생성, activation 분석 기반 prompt 생성, genetic algorithm 기반 prompt 최적화 등을 언급한다. 이런 방식은 black-box보다 체계적일 수 있지만, 저자는 여전히 몇 가지 문제를 지적한다.<br>

첫째, Gradient 계산이나 반복적 최적화가 필요하기 때문에 계산 비용이 크다. <br>
둘째, 공격 prompt를 자동 생성하려면 다양한 해로운 프롬프트와 validation set, 또는 보조 LLM이 필요할 수 있다. 저자는 large dataset, auxiliary model 이 필요할 수 있다고 말한다. <br>
셋째, 생성된 prompt가 부자연스러울 수 있다. 일부 방식은 사람이 보기 이상한 문자열을 붙여서 jailbreak를 시도한다. 이런 prompt는 탐지되기 쉽거나, 실제 사용성 측면에서 한계가 있다. <br>
넷째, 여전히 safety alignment를 제거하는 것은 아니다. <br>

## 2-3. White-box model manipulation
White-box model manipulation은 모델 내부 구조와 파라미터에 직접 접근하여 safety alignment를 약화시키거나 제거하려는 방식이다. <br>

앞의 white-box automatic prompt generation이 "모델 내부 정보를 이용해 더 효과적인 jailbreak prompt를 찾는 방식"이라면 model manipulation은 한 단계 더 나아가 모델 자체를 수정한다는 점에서 차이가 있다. <br>

기존 방식은 크게 fine-tuning, activation 조작, pruning으로 나눌 수 있다.<br>
Fine-tuning 방식은 harmful prompt에 답하도록 모델을 추가 학습시키지만, 모델 전체 파라미터에 영향을 주기 때문에 일반 언어 능력까지 손상시킬 수 있다.<br>
Activation 조작 방식은 refusal response와 관련된 내부 activation 방향을 찾아 이를 약화시키지만, 여러 layer에 걸쳐 조작이 필요하고 그 원리가 항상 명확한 것은 아니다.<br>
<br>

Pruning 방식은 TwinBreak와 가장 가까운 접근이다. Safety alignment에 관여한다고 판단되는 파라미터를 제거해 모델이 harmful prompt를 거절하지 않도록 만드는 방식이다.<br>
하지만 기존 pruning 방식은 safety parameter와 utility parameter를 정확히 구분하기 어렵다. 일반 언어 이해와 응답 생성에 중요한 파라미터까지 제거하면 모델 성능이 크게 떨어질 수 있다.<br>
<br>
저자들이 특히 문제로 보는 부분은 harmful prompt와 harmless prompt의 비교 방식이다. 기존 연구들도 두 종류의 prompt를 사용할 수 있지만, 두 prompt가 충분히 유사하지 않으면 activation 차이가 safety mechanism 때문인지 단순한 주제 차이 때문인지 구분하기 어렵다. TwinBreak는 이 문제를 해결하기 위해 문장 구조와 내용이 거의 같은 harmful/harmless twin prompt를 사용한다.<br>

## 2-4. Backdoor / pruning 기반 연구

TwinBreak의 핵심 관점은 LLM의 safety alignment를 backdoor와 유사하게 보는 것이다. Backdoor는 특정 trigger가 들어왔을 때 모델이 평소와 다른 출력을 내도록 만드는 숨겨진 기능이다. 예를 들어 이미지 분류 모델에서 특정 빨간 점이 있으면 새 사진을 dog로 분류하도록 만드는 경우가 이에 해당한다.<br><br>

저자들은 LLM에서도 비슷한 구조가 있다고 본다. 일반적인 harmless prompt에는 모델이 정상적으로 답하지만, harmful prompt가 들어오면 safety mechanism이 활성화되어 refusal response를 생성한다. 이 관점에서 harmful prompt는 safety mechanism을 작동시키는 trigger처럼 볼 수 있다.<br><br>

이러한 관점에서 저자들은 backdoor defense에서 사용되던 targeted pruning 아이디어를 LLM safety alignment 제거에 적용한다. Harmful prompt와 harmless twin prompt를 각각 입력하고, 두 입력의 activation difference가 큰 파라미터를 safety-related parameter 후보로 본다. 이후 모델의 일반 기능에 중요한 utility parameter를 제외한 뒤 pruning한다.<br><br>

따라서 TwinBreak는 기존 pruning 기반 jailbreak와 달리, harmful/harmless prompt의 구조적 유사성을 통제하여 safety parameter를 더 정밀하게 찾으려는 방법이라고 볼 수 있다.<br><br>

## [이 섹션에 대한 생각]

기존 jailbreak 연구를 살펴보면, 단순히 프롬프트를 조작하는 방식과 모델 내부를 직접 수정하는 방식 사이에 큰 차이가 있다는 점이 드러난다. Black-box jailbreak는 특정 입력에서 모델을 속이는 방식에 가깝지만, white-box model manipulation은 모델 내부의 safety alignment 자체를 약화시키려는 방식이다.<br><br>

이 점에서 TwinBreak는 더 근본적인 위협을 보여주는 논문이라고 생각한다. 특히 safety alignment를 backdoor처럼 해석한 관점이 흥미로웠다. 원래 safety alignment는 모델을 보호하기 위한 기능이지만, 저자들은 이를 특정 입력에 의해 활성화되는 내부 기능이라는 구조적 관점에서 분석한다. 이 비유가 완전히 증명된 것은 아니지만, harmful prompt와 harmless prompt의 activation 차이를 비교한다는 방법론으로 이어진다는 점에서 설득력이 있다.<br><br>

다만 twin prompt를 수작업으로 구성한다는 점은 한계로 이어질 수 있다고 생각한다. 두 prompt가 "충분히 유사하다"고 판단하는 기준이 완전히 객관적이지 않을 수 있기 때문이다. 따라서 후속 연구에서는 twin prompt의 유사성을 자동으로 측정하거나, 다양한 언어와 도메인에서 같은 방식이 작동하는지 확인하는 과정이 필요해 보인다.<br><br>

---

# 3. Methodology

## 3-1. 핵심 아이디어: Safety Alignment를 Backdoor처럼 보기

TwinBreak의 핵심 아이디어는 LLM의 safety alignment를 backdoor와 유사하게 해석하는 것이다. Backdoor는 특정 trigger가 들어왔을 때 모델이 평소와 다른 출력을 내도록 만드는 기능이다. 저자들은 harmful prompt가 LLM 내부의 safety mechanism을 작동시키는 trigger처럼 동작한다고 본다.<br><br>

예를 들어 harmless prompt가 들어오면 모델은 정상적으로 답변하지만, harmful prompt가 들어오면 모델은 refusal response를 생성한다. 저자들은 이 차이가 모델 내부 activation에도 반영된다고 보고, harmful prompt와 harmless prompt의 activation difference를 분석해 safety-related parameter를 찾으려 한다.<br><br>

즉, TwinBreak는 safety alignment를 단순히 prompt 수준에서 우회하는 것이 아니라, 모델 내부에서 safety mechanism에 관여하는 파라미터를 찾아 pruning하는 방식이다.<br><br>

## 3-2. TwinPrompt Dataset

저자들은 safety-related parameter를 더 정밀하게 찾기 위해 TwinPrompt라는 데이터셋을 만든다. TwinPrompt는 harmful prompt와 harmless prompt가 1:1로 대응되는 100개의 twin prompt pair로 구성된다.<br><br>

이 데이터셋은 HarmBench를 기반으로 만들어졌다. 저자들은 HarmBench에서 100개의 harmful prompt를 선택하고, 각 harmful prompt에 대응하는 harmless prompt를 수작업으로 작성했다. 이때 중요한 점은 두 prompt의 문법 구조와 내용이 최대한 유사해야 한다는 것이다.<br><br>

그 이유는 activation difference를 safety mechanism과 연결하기 위해서다. 만약 harmful prompt와 harmless prompt가 전혀 다른 주제를 다룬다면, 두 입력의 activation 차이가 safety 때문인지 단순한 주제 차이 때문인지 알 수 없다. 반대로 두 prompt가 거의 같은 구조를 가지고 있고 위험성만 다르다면, activation 차이는 safety mechanism과 더 관련 있을 가능성이 높다.<br><br>

## 3-3. Activation Difference를 이용한 Safety Parameter 식별

TwinBreak는 twin prompt pair를 모델에 입력하고, 선택된 layer에서 activation을 수집한다. 저자들은 전체 응답을 생성하지 않고 첫 번째 output token을 생성하는 과정에서 activation을 분석한다. Twin prompt가 충분히 유사하기 때문에, 첫 token 생성 과정에서도 safety-related difference가 드러난다고 보기 때문이다.<br><br>

Activation 분석은 모든 token을 대상으로 하지 않는다. 저자들은 마지막 6개의 input token activation을 사용한다. 이 위치가 prompt 전체 의미를 반영할 가능성이 높다고 보기 때문이다. 이후 activation difference의 L2 norm을 기준으로 중요한 token을 고르고, 이를 평균하여 parameter별 차이를 계산한다.<br><br>

이렇게 계산된 activation difference가 큰 parameter는 safety alignment와 관련 있을 가능성이 높은 후보로 간주된다. 기본 설정에서는 각 pruning iteration마다 activation difference가 큰 상위 1% parameter를 safety parameter candidate로 선택한다.<br><br>

## 3-4. Utility Parameter Exclusion

TwinBreak는 activation difference가 크다고 해서 해당 parameter를 바로 제거하지 않는다. 어떤 parameter는 safety alignment뿐 아니라 모델의 일반적인 언어 이해와 응답 생성 능력에도 중요할 수 있기 때문이다. 이런 parameter를 잘못 제거하면 모델이 정상적으로 작동하지 않을 수 있다.<br><br>

이를 막기 위해 저자들은 utility parameter를 별도로 식별한다. Utility parameter는 모델의 일반 기능에 중요한 parameter를 의미한다. 저자들은 harmless prompt끼리 pair를 만들고, 이들의 activation difference를 분석한다. 서로 다른 harmless prompt 사이에서 activation 차이가 크게 나타나는 parameter는 일반적인 의미 이해나 문장 처리에 중요한 parameter일 가능성이 높다고 본다.<br><br>

이렇게 찾은 utility parameter는 pruning 대상에서 제외된다. 즉, TwinBreak는 safety parameter candidate를 찾은 뒤, 그중 utility parameter와 겹치는 부분을 제거하고 나머지만 pruning한다. 이 과정은 모델 utility 손상을 줄이기 위한 핵심 장치이다.<br><br>

## 3-5. Target Layer 선택

저자들은 모델 전체를 pruning하지 않고 특정 layer만 대상으로 삼는다. 대상 모델은 decoder-only transformer 구조이며, 각 decoder block 내부의 MLP layer 중 Gate와 Up layer를 중심으로 분석한다.<br><br>

첫 번째 decoder block과 마지막 decoder block은 pruning 대상에서 제외한다. 첫 번째 block은 입력의 기본 정보를 처리하는 데 중요하고, 마지막 block은 최종 output token 생성에 중요하다고 보기 때문이다.<br><br>

또한 MLP의 Down layer는 기본 설정에서 제외된다. 실험 결과 Gate와 Up을 함께 대상으로 삼는 것이 attack success와 utility preservation 사이에서 가장 적절한 균형을 보였기 때문이다. 반대로 Gate, Up, Down을 모두 pruning하거나 self-attention까지 대상으로 삼으면 ASR은 증가할 수 있지만 utility 손상이 커지는 경향이 있었다.<br><br>

## 3-6. Iterative Targeted Pruning

TwinBreak는 safety-related parameter를 한 번에 많이 제거하지 않고, 여러 번에 나누어 pruning한다. 기본 설정은 5번의 pruning iteration이며, 각 iteration에서 activation difference가 큰 상위 1% parameter를 pruning한다.<br><br>

저자들이 iterative pruning을 사용하는 이유는 safety mechanism이 한 번에 모두 드러나는 단순한 구조가 아닐 수 있기 때문이다. 어떤 safety-related parameter는 처음부터 강하게 드러나지만, 어떤 parameter는 다른 parameter가 먼저 제거된 이후에 중요하게 나타날 수 있다.<br><br>

논문에서는 한 번에 5%를 pruning하는 방식보다 1%씩 5번 반복하는 방식이 더 좋은 결과를 보였다고 설명한다. 따라서 iterative pruning은 safety parameter를 더 세밀하게 찾기 위한 장치라고 볼 수 있다.<br><br>

## 3-7. Inference Strategy

TwinBreak는 pruning된 모델만으로 전체 응답을 생성하지 않는다. 저자들은 pruned model을 사용해 응답의 초기 50 tokens를 생성한 뒤, 나머지 응답은 원래의 unpruned model로 이어서 생성한다.<br><br>

이 전략은 safety refusal이 주로 응답 초기에 발생한다는 관찰에 기반한다. 모델이 처음에 거절 응답을 시작하지 않고 일반 답변 흐름으로 들어가면, 이후에는 원래 모델로 전환해도 safety mechanism이 다시 활성화될 가능성이 낮다고 보는 것이다.<br><br>

또한 이 방식은 utility 손상을 줄이는 역할도 한다. Pruned model은 safety alignment가 약화된 대신 일부 일반 성능 손상이 생길 수 있다. 따라서 응답 초반에만 pruned model을 사용하고, 이후에는 unpruned model을 사용함으로써 jailbreak 효과와 응답 품질을 동시에 유지하려 한다.<br><br>

## [이 섹션에 대한 생각]

TwinBreak의 방법론에서 가장 인상적인 부분은 twin prompt를 사용해 activation difference의 원인을 최대한 통제하려 한 점이다. 단순히 harmful prompt와 harmless prompt를 비교하면 주제 차이, 문장 구조 차이, 단어 차이가 모두 섞일 수 있다. 하지만 twin prompt는 두 입력의 구조를 비슷하게 맞추고 safety 여부만 다르게 만들어 safety-related signal을 더 잘 분리하려 한다.<br><br>

또한 utility parameter를 따로 식별해 pruning 대상에서 제외하는 점도 중요하다고 생각한다. 이 과정이 없다면 모델이 harmful prompt를 거절하지 않게 될 수는 있지만, 동시에 일반적인 답변 능력도 크게 망가질 수 있다. 따라서 TwinBreak는 단순히 모델을 망가뜨리는 것이 아니라, safety alignment와 utility를 분리하려는 시도라고 볼 수 있다.<br><br>

다만 twin prompt를 수작업으로 만든다는 점은 한계로 이어질 수 있다. 두 prompt가 충분히 유사한지 판단하는 기준이 주관적일 수 있고, 영어가 아닌 다른 언어나 다른 도메인에서도 같은 방식이 잘 작동하는지는 추가 검증이 필요해 보인다.<br><br>

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

## 4-3. 평가 지표

주요 평가 지표는 ASR, 즉 Attack Success Rate이다. ASR은 harmful prompt를 입력했을 때 모델이 거절하지 않고 유해한 응답을 생성한 비율을 의미한다.<br><br>

AdvBench, HarmBench, JailbreakBench에 대해서는 LlamaGuard3를 사용해 응답이 harmful한지 평가했다. <br>
StrongREJECT에 대해서는 별도의 evaluator를 사용했으며, 이 evaluator는 응답을 0에서 1 사이의 점수로 평가한다. 점수가 높을수록 harmful prompt에 대해 더 구체적이고 효과적인 응답을 생성했다는 의미이다.<br><br>

다만 저자들도 LlamaGuard3가 false positive와 false negative를 가질 수 있다고 언급한다. 따라서 ASR 수치는 공격 성능을 보여주는 중요한 지표이지만, 자동 평가기에 의존한다는 점은 이후 한계점으로 볼 수 있다.<br><br>

## 4-4. 주요 결과: 높은 ASR

실험 결과, TwinBreak는 여러 모델과 데이터셋에서 높은 ASR을 보였다. 예를 들어 HarmBench validation 기준으로 LLaMA 2 7B는 pruning 5회 이후 94% ASR을 보였고, LLaMA 3.1 8B는 99%, Gemma 2 9B는 94%, Qwen 2.5 7B는 97% ASR을 보였다.<br><br>

AdvBench에서도 비슷한 경향이 나타났다. LLaMA 2 7B는 94.62%, LLaMA 3.1 8B는 98.08%, Gemma 2 9B는 92.12%, Qwen 2.5 7B는 98.27% ASR을 보였다. JailbreakBench에서도 대부분 높은 ASR을 유지했다.<br><br>

StrongREJECT에서는 binary ASR 대신 평균 score를 사용했는데, pruning 이후 LLaMA 2 7B는 0.702, LLaMA 3.1 8B는 0.805, Gemma 2 9B는 0.683, Qwen 2.5 7B는 0.794를 기록했다. 이는 TwinBreak가 단순히 refusal을 피하는 데 그치지 않고, evaluator 기준으로도 harmful response를 생성하게 만들었다는 의미로 해석된다.<br><br>

## 4-5. 일반화 성능

저자들은 TwinBreak가 TwinPrompt에 사용된 prompt에만 작동하는지, 아니면 unseen harmful prompt에도 작동하는지 확인했다. 이를 위해 HarmBench validation split, AdvBench, JailbreakBench, StrongREJECT를 사용했다.<br><br>

결과적으로 TwinBreak는 pruning에 사용되지 않은 prompt에서도 높은 ASR을 보였다. 저자들은 이를 통해 TwinBreak가 특정 prompt를 암기하거나 특정 데이터셋에만 과적합된 것이 아니라, safety alignment와 관련된 일반적인 내부 parameter를 제거했다고 주장한다.<br><br>

이 부분은 논문의 핵심 주장과 연결된다. TwinBreak가 단순히 TwinPrompt에 있는 prompt만 통과시키는 방법이라면 의미가 제한적이다. 하지만 unseen prompt에서도 작동한다면, 저자들의 주장처럼 safety mechanism 자체가 약화되었다고 볼 여지가 생긴다.<br><br>

## 4-6. Utility 평가

저자들은 TwinBreak가 모델의 일반 성능을 얼마나 손상시키는지도 평가했다. 이를 위해 OpenBookQA, ARC-Challenge, HellaSwag, RTE, WinoGrande 같은 일반 LLM benchmark를 사용했다.<br><br>

결과적으로 pruning iteration이 증가할수록 utility가 약간 감소하는 경향은 있었지만, 전체적으로 큰 손상은 아니었다고 보고한다. 예를 들어 HellaSwag 기준으로 모델에 따라 최대 1%에서 6.5% 정도의 정확도 감소가 관찰되었다. 일부 모델에서는 pruning 이후 특정 benchmark 정확도가 오히려 약간 증가하기도 했다.<br><br>

저자들은 이를 TwinBreak가 safety-related parameter를 비교적 정밀하게 제거했기 때문이라고 해석한다. 특히 utility parameter를 사전에 식별해 pruning 대상에서 제외한 것이 모델 성능 유지에 중요했다고 본다.<br><br>

## 4-7. Hyperparameter 실험

저자들은 TwinBreak의 여러 설정을 바꾸어 어떤 요소가 중요한지 확인했다.<br><br>

첫째, utility parameter exclusion을 하지 않으면 모델 출력이 nonsensical하게 망가졌다. 이는 utility parameter를 보호하는 과정이 필수적이라는 것을 보여준다.<br><br>

둘째, Gate와 Up layer를 함께 pruning하는 설정이 가장 균형이 좋았다. Gate, Up, Down을 모두 pruning하거나 self-attention까지 pruning하면 ASR은 높아질 수 있지만 utility 손상이 커졌다.<br><br>

셋째, 한 번에 5%를 pruning하는 것보다 1%씩 5번 iterative pruning하는 방식이 더 좋았다. 저자들은 safety-related parameter가 한 번에 모두 드러나는 것이 아니라, pruning 과정에서 점진적으로 드러날 수 있기 때문이라고 해석한다.<br><br>

넷째, TwinPrompt 대신 구조적으로 유사하지 않은 harmful/harmless prompt를 사용하면 ASR이 낮아지고 utility loss가 커졌다. 이는 twin prompt의 구조적 유사성이 TwinBreak의 핵심 요소임을 보여준다.<br><br>

## 4-8. 기존 방법과의 비교

저자들은 TwinBreak를 기존 white-box jailbreak 방법인 Directional Ablation과 Set Difference 방식과 비교했다.<br><br>

LLaMA 2 7B 기준으로 TwinBreak는 HarmBench, JailbreakBench, AdvBench, StrongREJECT에서 전반적으로 더 높은 성능을 보였다. 또한 runtime 측면에서도 TwinBreak는 162초가 걸렸고, Directional Ablation은 630초, Set Difference는 4시간 이상이 걸렸다고 보고한다.<br><br>

저자들은 이를 통해 TwinBreak가 기존 방식보다 더 빠르고, 더 높은 ASR을 보이며, utility 손상도 상대적으로 작다고 주장한다. 특히 twin prompt를 사용해 safety-related parameter를 더 정밀하게 찾는 점이 기존 방식과의 차이라고 설명한다.<br><br>

## [이 섹션에 대한 생각]

Results에서 가장 중요한 점은 TwinBreak가 단순히 특정 prompt에만 성공한 것이 아니라 여러 dataset과 여러 model에서 높은 ASR을 보였다는 것이다. 특히 unseen prompt에서도 높은 성공률을 보인 점은 safety mechanism 자체가 약화되었을 가능성을 뒷받침한다.<br><br>

또한 utility 평가를 함께 수행한 점도 중요하다. Jailbreak 공격이 성공하더라도 모델이 완전히 망가진 상태라면 의미가 줄어든다. TwinBreak는 utility parameter exclusion과 50-token inference strategy를 통해 모델의 일반 성능 손상을 줄이려 했다는 점에서, 단순한 pruning 공격보다 더 정교한 접근으로 보인다.<br><br>

다만 평가가 LlamaGuard3나 StrongREJECT evaluator 같은 자동 평가기에 의존한다는 점은 한계로 볼 수 있다. 자동 평가기는 편리하지만, 실제 harmfulness를 완벽히 판단한다고 보기 어렵다. 따라서 사람 평가나 더 다양한 평가 기준이 추가되면 결과의 신뢰성이 더 높아질 수 있을 것 같다.<br><br>


| 평가 항목 | 저자의 결과 해석 |
|:-----:|:------:|
| ASR | 여러 모델과 데이터셋에서 높은 공격 성공률을 보임 |
| Generalization | TwinPrompt에 없는 unseen prompt에도 효과가 나타남 |
| Utility | pruning 이후 일부 성능 저하는 있으나 비교적 제한적 |
| Runtime | 기존 white-box 방법보다 빠른 실행 시간 |
| Ablation | twin prompt, utility exclusion, iterative pruning이 성능에 중요 |

---

# 5. Limitations & Discussion

## 5-1. White-box Threat Model의 한계

TwinBreak는 white-box threat model을 전제로 한다. 즉, 공격자가 모델의 구조와 파라미터에 접근할 수 있어야 한다. 이는 오픈소스 LLM처럼 모델을 직접 다운로드할 수 있는 환경에서는 현실적인 위협이 될 수 있지만, API로만 접근 가능한 상용 LLM에는 바로 적용하기 어렵다.<br><br>

따라서 TwinBreak의 결과를 모든 LLM 사용 환경에 그대로 일반화하기는 어렵다. 이 논문은 “모든 사용자가 쉽게 실행할 수 있는 공격”을 보였다기보다는, “모델 내부 접근이 가능한 경우 safety alignment가 얼마나 취약할 수 있는지”를 보여준 연구로 이해하는 것이 적절하다.<br><br>

## 5-2. TwinPrompt Dataset의 한계

TwinBreak의 핵심은 harmful prompt와 harmless prompt를 구조적으로 유사하게 만든 twin prompt이다. 하지만 TwinPrompt는 저자들이 수작업으로 구성한 100개의 prompt pair로 이루어져 있다.<br><br>

이 방식은 정밀한 비교를 가능하게 하지만, 동시에 한계도 가진다. 먼저 “두 prompt가 충분히 유사한가”를 판단하는 기준이 완전히 객관적이라고 보기 어렵다. 또한 데이터셋 규모가 크지 않고, 영어 기반 prompt에 집중되어 있기 때문에 다른 언어나 다른 도메인에서도 같은 방식이 잘 작동하는지는 추가 검증이 필요하다.<br><br>

## 5-3. Safety Alignment를 Backdoor처럼 보는 가정

저자들은 safety alignment를 backdoor-like mechanism으로 해석한다. 이 관점은 TwinBreak의 핵심 아이디어이며, harmful prompt가 safety mechanism을 trigger한다는 설명은 직관적이다.<br><br>

하지만 safety alignment가 실제로 backdoor처럼 특정 파라미터 집합에 의해 작동한다고 단정하기는 어렵다. 모델마다 alignment 방식이 다를 수 있고, safety behavior가 여러 layer와 기능에 넓게 분산되어 있을 가능성도 있다. 따라서 이 가정은 실험적으로 효과를 보였지만, 모든 LLM에 대해 일반적인 원리로 확정되었다고 보기는 어렵다.<br><br>

## 5-4. 자동 평가기의 한계

논문은 ASR 평가를 위해 LlamaGuard3와 StrongREJECT evaluator를 사용한다. 이러한 자동 평가기는 많은 응답을 빠르게 평가할 수 있다는 장점이 있지만, harmfulness를 완벽하게 판단한다고 보기는 어렵다.<br><br>

저자들도 LlamaGuard3가 false positive와 false negative를 가질 수 있다고 언급한다. 즉, 실제로는 유해하지 않은 응답을 유해하다고 판단하거나, 반대로 유해한 응답을 놓칠 수 있다. 따라서 TwinBreak의 성능을 더 신뢰성 있게 평가하려면 사람 평가나 더 다양한 evaluator를 함께 사용하는 것이 필요해 보인다.<br><br>

## 5-5. 방어 기법의 구체성 부족

이 논문은 TwinBreak라는 공격 방법을 제안하고, 기존 safety alignment가 white-box 환경에서 취약할 수 있음을 보여준다. 그러나 이를 막기 위한 구체적인 방어 기법은 충분히 제시하지 않는다.<br><br>

저자들은 safety mechanism을 모델의 더 넓은 파라미터 공간에 분산시키고, core utility와 더 강하게 얽히게 만드는 방향을 제안한다. 이렇게 하면 공격자가 safety alignment를 제거하려 할 때 모델의 일반 성능도 함께 손상되어 공격이 어려워질 수 있다. 하지만 이는 방향성에 가깝고, 실제 구현 가능한 방어 알고리즘으로 제시된 것은 아니다.<br><br>

## 5-6. 윤리적 고민

TwinBreak는 LLM safety alignment의 취약성을 보여준다는 점에서 보안 연구로서 의미가 있다. 하지만 동시에 safety alignment를 제거하는 방법을 다룬다는 점에서 악용 가능성도 존재한다.<br><br>

저자들은 이 연구가 LLM의 기존 위험을 새롭게 만든 것이 아니라, 이미 존재하는 위험을 드러내는 것이라고 설명한다. 그러나 코드와 데이터셋이 공개되는 경우, 방어 연구자뿐 아니라 악의적인 사용자도 이를 활용할 수 있다. 따라서 이런 연구는 공개 범위와 재현 가능성, 방어 목적의 안내 사이에서 신중한 균형이 필요하다고 생각한다.<br><br>

## [이 섹션에 대한 생각]

내가 보기에 이 논문의 가장 큰 한계는 white-box 환경을 전제로 한다는 점이다. 일반적인 사용자가 API 기반 LLM에 대해 TwinBreak를 바로 적용하기는 어렵다. 하지만 오픈소스 LLM이 계속 확산되고 있다는 점을 고려하면, 이 위협 모델이 완전히 비현실적이라고 보기도 어렵다.<br><br>

또한 twin prompt라는 아이디어는 설득력 있지만, 수작업으로 구성된 데이터셋에 의존한다는 점은 아쉽다. 후속 연구에서는 twin prompt를 자동 생성하거나, prompt pair의 유사성을 정량적으로 평가하는 방법이 필요해 보인다.<br><br>

마지막으로, 이 논문은 공격을 잘 보여주지만 방어 방법은 아직 구체적이지 않다. 따라서 TwinBreak의 진짜 의미는 “이 방법으로 공격할 수 있다”에서 끝나는 것이 아니라, 앞으로 safety alignment를 모델 내부에 어떻게 더 강건하게 통합할 것인지 묻는 데 있다고 생각한다.<br><br>

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

저자들은 harmful prompt와 harmless prompt를 거의 비슷한 구조로 만든 twin prompt를 사용한다. 그리고 두 prompt가 모델 내부에서 만들어내는 activation 차이를 비교해 safety mechanism과 관련된 parameter를 찾는다. 이후 모델의 일반 성능에 중요한 utility parameter는 제외하고, safety-related parameter만 pruning하려고 한다.<br><br>

결과적으로 TwinBreak는 여러 LLM과 데이터셋에서 높은 ASR을 보였고, 모델의 일반 성능 손상은 비교적 제한적이었다고 보고한다. 이를 통해 저자들은 현재의 safety alignment가 white-box 환경에서는 충분히 강건하지 않을 수 있음을 보여주고자 했다.<br><br>

## 6-2. 느낀 점

이 논문을 읽으면서 가장 먼저 든 생각은 LLM의 안전 문제가 생각보다 더 내부적인 문제일 수 있다는 것이었다. 처음에는 jailbreak라고 하면 단순히 프롬프트를 교묘하게 바꿔서 모델을 속이는 방식만 떠올렸다. 하지만 이 논문은 모델 내부의 parameter를 직접 분석하고 수정하는 방식도 가능하다는 점을 보여준다. 특히 오픈소스 LLM이 많아지는 상황에서는 모델을 직접 다운로드해 분석할 수 있기 때문에, white-box 환경을 완전히 비현실적인 가정으로만 보기는 어렵다고 느꼈다.<br><br>

또 인상적이었던 부분은 twin prompt라는 아이디어였다. 단순히 harmful prompt와 harmless prompt를 비교하면 두 문장의 주제나 구조가 달라서 activation 차이의 원인을 정확히 알기 어렵다. 하지만 두 prompt를 최대한 비슷하게 만들고 위험성만 다르게 하면, 모델 내부에서 safety mechanism이 어떻게 반응하는지 더 잘 볼 수 있다. 이 점이 논문의 핵심 아이디어이자 가장 설득력 있는 부분이라고 생각했다.<br><br>

다만 이 논문이 공격 방법을 다룬다는 점에서는 조심스럽게 봐야 한다고 생각한다. 저자들은 보안 취약성을 드러내기 위한 연구라고 설명하지만, safety alignment를 제거하는 방법이 공개되면 악용될 가능성도 있다. 그래서 이런 연구는 단순히 “공격이 가능하다”에서 끝나는 것이 아니라, 앞으로 어떻게 방어할 것인지까지 함께 논의되어야 한다고 느꼈다.<br><br>

## 6-3. 앞으로 더 읽어볼 논문

이 논문을 더 잘 이해하기 위해서는 먼저 기존 white-box jailbreak 연구를 더 읽어볼 필요가 있다고 생각한다. 특히 논문에서 비교 대상으로 등장한 Directional Ablation과 Set Difference 방식은 TwinBreak와 직접적으로 연결되는 연구이기 때문에, 이 논문들과 비교해보면 TwinBreak의 차별점이 더 명확해질 것 같다.<br><br>

또한 safety alignment와 refusal behavior를 분석하는 연구도 읽어보고 싶다. 모델이 왜 어떤 질문에는 답하고, 어떤 질문에는 거절하는지 내부적으로 분석하는 연구를 보면 TwinBreak의 가정이 얼마나 타당한지 더 잘 이해할 수 있을 것 같다.<br><br>

마지막으로 backdoor detection이나 pruning 관련 연구도 함께 읽어볼 만하다. TwinBreak는 safety alignment를 backdoor처럼 해석하고 pruning을 적용하기 때문에, 기존 backdoor 방어 연구를 이해하면 이 논문의 배경을 더 깊게 이해할 수 있을 것 같다.<br><br>

## 6-4. 앞으로 해볼 것

직접 해보고 싶은 것은 먼저 twin prompt의 유사성이 결과에 얼마나 영향을 주는지 확인하는 것이다. 논문에서는 twin prompt가 중요하다고 설명하지만, 실제로 prompt가 얼마나 비슷해야 하는지에 대한 기준은 완전히 명확하지 않다. 그래서 prompt pair의 유사도를 다르게 구성했을 때 결과가 어떻게 달라지는지 비교해보고 싶다.<br><br>

두 번째로는 한국어 prompt에서도 비슷한 방식이 작동하는지 확인해보고 싶다. 논문에서 사용한 TwinPrompt는 영어 기반 데이터셋이기 때문에, 한국어 harmful/harmless prompt pair를 만들었을 때도 activation 차이가 비슷하게 나타나는지 궁금하다. 만약 한국어에서도 비슷한 결과가 나온다면, 이 방법이 특정 언어에만 의존하지 않는지 확인할 수 있을 것이다.<br><br>

세 번째로는 방어 관점에서 이 문제를 보고 싶다. TwinBreak가 safety alignment를 제거할 수 있다면, 반대로 safety alignment가 특정 parameter에 너무 집중되어 있는지 측정하고, 이를 더 넓게 분산시키는 방법을 연구할 수 있을 것 같다. 즉, 공격을 재현하는 것보다 “어떻게 하면 이런 pruning 공격에도 안전한 모델을 만들 수 있을까?”라는 방향으로 발전시켜보고 싶다.<br><br>

## 6-5. 마무리

TwinBreak는 LLM safety alignment가 모델 내부에서 어떻게 취약해질 수 있는지를 보여주는 논문이다. 이 논문을 통해 LLM 안전성은 단순히 출력 결과를 필터링하는 문제가 아니라, 모델 내부 구조와 학습된 parameter 수준에서 함께 고민해야 하는 문제라는 점을 배웠다.<br><br>

앞으로 LLM이 더 널리 사용될수록 안전장치의 중요성은 더 커질 것이다. 따라서 단순히 jailbreak를 막는 수준을 넘어, safety alignment가 모델 내부에서 더 강건하게 유지될 수 있는 방법을 연구하는 것이 필요하다고 생각한다.<br><br>

---

# 7. References

이번 리뷰에서 중심이 된 논문은 다음과 같다.

* Torsten Krauß, Hamid Dashtbani, and Alexandra Dmitrienko. **TwinBreak: Jailbreaking LLM Security Alignments based on Twin Prompts.** 34th USENIX Security Symposium, 2025.

이 논문을 이해하는 데 중요했던 관련 연구와 데이터셋은 다음과 같다.

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
