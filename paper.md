| Law              | Queries | Faithfulness | Claim Faithfulness | Answer Relevancy | Context Precision | Context Relevance |
| ---------------- | ------: | -----------: | -----------------: | ---------------: | ----------------: | ----------------: |
| Labour           |      65 |   **0.9639** |         **0.9642** |           0.8256 |            0.8337 |            0.9615 |
| Financial        |       ? |            ? |                  ? |                ? |                 ? |                 ? |
| Personal Affairs |       ? |            ? |                  ? |                ? |                 ? |                 ? |

| Law              | Internal Faithfulness | RAGAS Faithfulness | Difference |
| ---------------- | --------------------: | -----------------: | ---------: |
| Labour           |                0.9815 |             0.9639 |    -0.0176 |
| Financial        |                     ? |                  ? |          ? |
| Personal Affairs |                     ? |                  ? |          ? |

=== Financial Law RETRIEVAL + GENERATION BENCHMARK ===
┌─────────┬─────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ (index) │ system │ queries │ R1 │ R3 │ R5 │ R10 │ P5 │ P10 │ MRR │ nDCG5 │ nDCG10 │
├─────────┼─────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0 │ 'db-vector' │ 65 │ '0.8231' │ '0.9692' │ '0.9846' │ '1.0000' │ '0.2000' │ '0.1015' │ '0.8928' │ '0.9140' │ '0.9195' │
└─────────┴─────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

=== Financial Law GENERATION EVALUATION ===
┌─────────┬─────────┬─────────────┬──────────────┬─────────────────────┬──────────┐
│ (index) │ queries │ correctness │ faithfulness │ citationCorrectness │ passRate │
├─────────┼─────────┼─────────────┼──────────────┼─────────────────────┼──────────┤
│ 0 │ 65 │ '0.9846' │ '0.9892' │ '1.0000' │ '1.0000' │
└─────────┴─────────┴─────────────┴──────────────┴─────────────────────┴──────────┘

============================================================
EGYPTIAN Financial LAW RAGAS EVALUATION
============================================================
Queries: 65
Faithfulness: 0.9264
Answer Relevancy: 0.8363
Context Precision: 0.7924
Context Relevance: 0.9808
============================================================

============================================================
EGYPTIAN Financial LAW RAGAS FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC
============================================================
Queries: 65
Faithfulness: 0.9280
Low-faithfulness: 4
Threshold: 0.60
============================================================

====================================================================================================
EGYPTIAN Financial Law RAGAS FAITHFULNESS CLAIM-LEVEL INSPECTOR
====================================================================================================
Threshold: 0.60 | Cases: 4

---

financial-030 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: متى يجوز للجهة الإدارية إجراء صرف أو الحصول على تمويل أو الالتزام ببرنامج يترتب عليه عبء مالي؟
Answer: يجوز للجهة الإدارية إجراء صرف أو الحصول على تمويل أو الالتزام ببرنامج (أو غيره) في موازنة العامين للدولة أو موازنات الهيئات العامة الاقتصادية والهيئة القومية للإنتاج الحيواني، إذا كان ذلك يترتب عليه اتفاق بإغلاق موازنتها أو ترتيبأعباء مالية على هذه الموازنة، بشرط أن يكون ذلك **"وفقاً بما تقره مجلس الوزراء"** [1].

_(تفسير: بناءً على المادة 31 من القانون رقم 6 لسنة 2022، فإن موافقة مجلس الوزراء هي الشرط الأساسي لجواز هذه التصرفات المالية التي ترتب أعباءً على الموازنات المذكورة)_.

هذه الإجابة لا تمثل استشارة قانونية ملزمة.

Claim 1 [UNSUPPORTED]
Statement: يجوز للجهة الإدارية إجراء صرف أو الحصول على تمويل أو الالتزام ببرنامج في موازنة العامين للدولة أو موازنات الهيئات العامة الاقتصادية والهيئة القومية للإنتاج الحيواني إذا كان ذلك يترتب عليه اتفاق بإغلاق موازنة الجهة الإدارية أو ترتيب أعباء مالية على موازنة الجهة الإدارية.
Reason: The context in Article 31 explicitly states 'لا يجوز' (it is not permissible) for administrative entities to do these things unless approved by the Council of Ministers, whereas the statement claims it 'يجوز' (is permissible) without mentioning the necessary condition.

Claim 2 [SUPPORTED]
Statement: يشترط لجواز إجراء الصرف أو الحصول على تمويل أو الالتزام ببرنامج من قبل الجهة الإدارية أن يكون ذلك وفقاً لما تقره مجلس الوزراء.
Reason: Article 31 states that these actions are not permissible 'إلا وفقا بما تقره مجلس الوزراء' (except as approved by the Council of Ministers), which makes the Council's approval a requirement.

Claim 3 [SUPPORTED]
Statement: تعتبر موافقة مجلس الوزراء هي الشرط الأساسي لجواز التصرفات المالية التي ترتب أعباءً على موازنة العامين للدولة أو موازنات الهيئات العامة الاقتصادية والهيئة القومية للإنتاج الحيواني بناءً على المادة 31 من القانون رقم 6 لسنة 2022.
Reason: This is a direct inference from Article 31 of Law No. 6 of 2022, which prohibits such financial burdens unless approved by the Council of Ministers.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context consists of legal articles and definitions; it does not contain any disclaimer stating that the answer does not represent binding legal advice.

---

financial-041 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: هل يجوز للجهة الإدارية قبول التبرعات أو الإعانات أو الهبات دون موافقات مسبقة؟
Answer: لا يجوز للجهة الإدارية قبول التبرعات أو الإعانات أو الهبات دون موافقات مسبقة؛ حيث تنص المادة رقم (43) من القانون رقم 6 لسنة 2022 على أنه: "لا يجوز لأي جهة إدارية أو أي من مستوياتها أو موظفيها قبول أي تبرعات أو إعانات أو هبات إلا بعد الحصول على الموافقات اللازمة وفقاً للقنوات واللوائح والتوانيغ السارية" [2].

يرجى العلم أن هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: لا يجوز للجهة الإدارية قبول التبرعات أو الإعانات أو الهبات دون موافقات مسبقة.
Reason: This is directly supported by Article (43) in the context, which states that administrative entities or their employees cannot accept donations, aids, or grants except after obtaining the necessary approvals.

Claim 2 [SUPPORTED]
Statement: تنص المادة رقم (43) من القانون رقم 6 لسنة 2022 على أنه لا يجوز لأي جهة إدارية أو أي من مستوياتها أو موظفيها قبول أي تبرعات أو إعانات أو هبات إلا بعد الحصول على الموافقات اللازمة وفقاً للقنوات واللوائح والتوانيغ السارية.
Reason: This statement is a word-for-word transcription of the text provided for Article (43) of Law No. 6 of 2022.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: While the information is derived from the text, this statement is a meta-commentary about the source of the answer and is not a fact contained within the legal text itself.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: This is a legal disclaimer and is not mentioned anywhere in the provided legal context.

---

financial-046 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: ما السلع أو الأصول التي تُراعى عند إعداد الموازنة غير المتعلقة بالسلع الاستهلاكية؟
Answer: بناءً على النصوص القانونية المقدمة، فإن السلع أو الأصول التي تُراعى عند إعداد موازنة غير السلع الاستهلاكية هي:

**الممتلكات التي تمتلكها الجهة الإدارية**، حيث نصت المادة (49) على أنه "وعد جهات تحصيل جهة إدارية عن شراء السلع الاستهلاكية أو الممتلكات التي تمتلكها، وتوضح فيما تم ما تفتقده حتى نهاية السنة المالية على نوع من الأصول التي يكون فيها مبلغ مخصص على حدة، وفقاً لنظام المحاسبي المحتسب عليه" [1].

هذا الإجابة تم استخلاصها من النص القانوني المتاح ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: السلع أو الأصول التي تُراعى عند إعداد موازنة غير السلع الاستهلاكية هي الممتلكات التي تمتلكها الجهة الإدارية.
Reason: Article (49) mentions that administrative entities are counted for the purchase of consumer goods or properties they own (الممتلكات التي تمتلكها) in the context of budgets other than consumer goods.

Claim 2 [SUPPORTED]
Statement: نصت المادة (49) على أن الممتلكات التي تمتلكها الجهة الإدارية تُعد من أنواع الأصول التي يكون لها مبلغ مخصصعلى حدة وفقاً للنظام المحاسبي المحتسب عليه.
Reason: Article (49) explicitly states that properties owned by the administrative entity are a type of asset for which a separate amount is allocated according to the accounting system used (نوع من الأصول التي يكون فيها مبلغ مخصص على حدة، وفقاً لنظام المحاسبي المحتسب عليه).

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة تم استخلاصها من النص القانوني المتاح.
Reason: This is a meta-statement about the source of the information. While true in the context of the task, it is not a fact contained within the legal text provided in the context.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: This is a legal disclaimer. There is no such disclaimer or statement within the provided legal text (Articles 1, 3, 7, 12, 20, 21, 36, 37, 49, 74).

---

financial-059 | faithfulness=0.5000 | claims=2 | supported=1 | unsupported=1
Question: من يحدد سنوياً مواعيد تقديم القوائم المالية والحسابات الختامية؟
Answer: يحدد الوزير (المقصود به الوزير المختص بالشؤون المالية وفقاً للمادة 1) سنوياً القواعد الضرورية اللازمة لتحديد مواعيد تقديم الجهات الإدارية والوزارات الاقتصادية لقوائمها المالية وحساباتها الختامية إلى الوزارة والجهاز المركزي للمحاسبات، وذلك استناداً للمادة (62) بند (أ) [3]، [6].

Claim 1 [UNSUPPORTED]
Statement: يحدد الوزير المختص بالشؤون المالية وفقاً للمادة 1 سنوياً القواعد الضرورية اللازمة لتحديد مواعيد تقديم الجهات الإدارية والوزارات الاقتصادية لقوائمها المالية وحساباتها الختامية إلى الوزارة والجهاز المركزي للمحاسبات.
Reason: While Article 62 states that the Minister issues these rules annually, Article 1 is the definitions section and does not establish this rule. The statement incorrectly attributes the authority to Article 1 instead of Article62.

Claim 2 [SUPPORTED]
Statement: يتم تحديد مواعيد تقديم القوائم المالية والحسابات الختامية استناداً للمادة (62) بند (أ).
Reason: Article 62, paragraph (a) explicitly states that the Minister issues the necessary rules annually to determine the dates for administrative bodies and economic ministries to submit their financial statements and final accounts to the Ministry and the Central Auditing Organization.

====================================================================================================

=== Personal Affairs Law RETRIEVAL + GENERATION BENCHMARK ===
┌─────────┬─────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ (index) │ system │ queries │ R1 │ R3 │ R5 │ R10 │ P5 │ P10 │ MRR │ nDCG5 │ nDCG10 │
├─────────┼─────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0 │ 'db-vector' │ 70 │ '0.8714' │ '1.0000' │ '1.0000' │ '1.0000' │ '0.2114' │ '0.1130' │ '0.9333' │ '0.9516' │ '0.9516' │
└─────────┴─────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

=== Personal Affairs Law GENERATION EVALUATION ===
┌─────────┬─────────┬─────────────┬──────────────┬─────────────────────┬──────────┐
│ (index) │ queries │ correctness │ faithfulness │ citationCorrectness │ passRate │
├─────────┼─────────┼─────────────┼──────────────┼─────────────────────┼──────────┤
│ 0 │ 70 │ '0.9929' │ '0.9929' │ '1.0000' │ '0.9857' │
└─────────┴─────────┴─────────────┴──────────────┴─────────────────────┴──────────┘

============================================================
EGYPTIAN Personal Affairs LAW RAGAS EVALUATION
============================================================
Queries: 70
Faithfulness: 0.8141
Answer Relevancy: 0.8023
Context Precision: 0.9012
Context Relevance: 1.0000
============================================================
============================================================
RAGAS Personal Affairs FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC
============================================================
Queries: 70
Faithfulness: 0.8166
Low-faithfulness: 5
Threshold: 0.60
============================================================

====================================================================================================
RAGAS Personal Affairs LAW FAITHFULNESS CLAIM-LEVEL INSPECTOR
====================================================================================================
Threshold: 0.60 | Cases: 5

---

personal-001 | faithfulness=0.3333 | claims=3 | supported=1 | unsupported=2
Question: متى تعتبر نفقة المطلقة دينًا؟
Answer: تعتبر نفقة المطلقة ديناً من تاريخ الطلاق، وذلك للمطلقة التي تستحق النفقة [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: تعتبر نفقة المطلقة ديناً من تاريخ الطلاق للمطلقة التي تستحق النفقة.
Reason: This is explicitly stated in Article 2 (المادة 2), which says: 'المطلقة التي تستحق النفقة تعتبر نفقتها دينا كما في المادة السابقة من تاريخ الطلاق'.

Claim 2 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: While the information provided in the context consists of legal texts, the statement itself is a meta-commentary about the source of an answer, not a fact that can be inferred from the legal articles themselves.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context contains legal articles but does not contain any disclaimer stating that the answers provided do not constitute binding legal advice.

---

personal-050 | faithfulness=0.3333 | claims=3 | supported=1 | unsupported=2
Question: متى يستعان بأهل الخبرة في دعاوى الفسخ المتعلقة بعيوب الزواج؟
Answer: يستعان بأهل الخبرة في العيوب التي يُطلب فسخ الزواج من أجلها، وذلك وفقاً لما نصت عليه المادة 11 من القانون رقم 25 لسنة 1920 [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: يستعان بأهل الخبرة في العيوب التي يُطلب فسخ الزواج من أجلها وفقاً لما نصت عليه المادة 11 من القانون رقم 25 لسنة 1920.
Reason: This is explicitly stated in the text of Article 11 of Law No. 25 of 1920: 'يستعان باهل الخبرة في العيوب التي يطلب فسخ الزواج من اجلها'.

Claim 2 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص المقدمة.
Reason: The context provided consists of legal texts, but the statement is a meta-commentary about the source of an answer, which is not a fact contained within the legal articles themselves.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context contains legal articles but does not contain any disclaimer stating that the information does not constitute binding legal advice.

---

personal-068 | faithfulness=0.3333 | claims=3 | supported=1 | unsupported=2
Question: كيف يتصرف القاضي إذا كان الزوج غائباً وله مال ظاهر؟
Answer: وفقاً للنصوص القانونية المقدمة، إذا كان الزوج غائباً وله مال ظاهر، فإن القاضي يتصرف كالتالي:

يتم تنفيذ الحكم عليه بالنفقة في ماله [1].

يرجى العلم أن هذه الإجابة تستند إلى النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: وفقاً للنصوص القانونية المقدمة، إذا كان الزوج غائباً وله مال ظاهر، فإن القاضي ينفذ الحكم بالنفقة في مال الزوج الغائب.
Reason: This is directly stated in Article 5 (مادة 5), which says: 'اذا كان الزوج غايبا... فان كان له مال ظاهر نفذ الحكم عليه بالنفقة في ماله'.

Claim 2 [UNSUPPORTED]
Statement: هذه الإجابة تستند إلى النصوص القانونية المقدمة.
Reason: The statement is a meta-commentary about the source of the information. While the information provided in the context is indeed legal text, the context itself does not contain a statement asserting that 'this answer is based on the provided legal texts'.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context consists of legal articles and does not contain any disclaimer stating that the information does not constitute binding legal advice.

---

personal-019 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: كم نسخة يحرر بها محضر جرد الأموال؟
Answer: يُحرر محضر جرد أموال المعني بالحماية من نسختين، وذلك وفقاً لما نصت عليه المادة 5 من القانون رقم 1088 لسنة 2000 [1].

تنويه: هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: يُحرر محضر جرد أموال المعني بالحماية من نسختين.
Reason: Article 5 explicitly states that the procedures for inventorying the assets of the person under protection are recorded in a report consisting of two copies ('في محضر من نسختين').

Claim 2 [SUPPORTED]
Statement: تحرير محضر جرد أموال المعني بالحماية من نسختين يتم وفقاً لما نصت عليه المادة 5 من القانون رقم 1088 لسنة 2000.
Reason: The context provided for Law No. 1088 of 2000, Article 5, specifically mentions that the inventory report shall be made in two copies.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: This is a meta-statement about the source of the answer, not a fact that can be inferred from the legal text of the laws themselves.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: This is a legal disclaimer and is not mentioned or inferable from the provided legal articles of Law No. 1088 of 2000.

---

personal-034 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: ما المدة التي لا تُسمع بعدها دعوى النفقة من تاريخ الطلاق؟
Answer: بناءً على النصوص القانونية المقدمة، لا تُسمع دعوى النفقة لمدة تزيد على سنة من تاريخ الطلاق، وذلك وفقاً لما نصت عليه المادة 17 من القانون رقم 25 لسنة 1929 [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: لا تُسمع دعوى النفقة إذا مر على تاريخ الطلاق مدة تزيد على سنة.
Reason: This is directly stated in Article 17 (مادة 17) of the provided text: 'لا تسمع دعوي النفقة لمدة مدة لمدة تزيد علي سنة من تاريخ الطلاق'.

Claim 2 [SUPPORTED]
Statement: تنص المادة 17 من القانون رقم 25 لسنة 1929 على أن دعوى النفقة لا تُسمع بعد مرور سنة من تاريخ الطلاق.
Reason: The context explicitly links Article 17 of Law No. 25 of 1929 to the rule that alimony claims are not heard if more than a year has passed since the divorce.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: While the statements are derived from the text, this specific sentence is a meta-commentary about the source of the answer and is not a fact contained within the legal text itself.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context consists of legal articles; it does not contain a disclaimer stating that the answers provided are not binding legal advice.

====================================================================================================

هذه الإجابة تم استخلاصها من النصوص القانونية المتاحة
ولا تمثل استشارة قانونية ملزمة.

=== Personal Affairs Law RETRIEVAL + GENERATION BENCHMARK ===
┌─────────┬─────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ (index) │ system │ queries │ R1 │ R3 │ R5 │ R10 │ P5 │ P10 │ MRR │ nDCG5 │ nDCG10 │
├─────────┼─────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0 │ 'db-vector' │ 70 │ '0.8714' │ '1.0000' │ '1.0000' │ '1.0000' │ '0.2114' │ '0.1130' │ '0.9333' │ '0.9516' │ '0.9516' │
└─────────┴─────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
┌─────────┬─────────┬─────────────┬──────────────┬─────────────────────┬──────────┐
│ (index) │ queries │ correctness │ faithfulness │ citationCorrectness │ passRate │
├─────────┼─────────┼─────────────┼──────────────┼─────────────────────┼──────────┤
│ 0 │ 70 │ '0.9957' │ '0.9986' │ '1.0000' │ '1.0000' │
└─────────┴─────────┴─────────────┴──────────────┴─────────────────────┴──────────┘
============================================================
EGYPTIAN PERSONAL AFFAIRS LAW RAGAS EVALUATION
============================================================
Queries: 70
Faithfulness: 0.9833
Answer Relevancy: 0.8140
Context Precision: 0.8954
Context Relevance: 1.0000
============================================================
============================================================
RAGAS PERSONAL AFFAIRS FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC
============================================================
Queries: 70
Faithfulness: 0.9833
Low-faithfulness: 1
Threshold: 0.60
============================================================

=== Financial Law RETRIEVAL + GENERATION BENCHMARK ===
┌─────────┬─────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ (index) │ system │ queries │ R1 │ R3 │ R5 │ R10 │ P5 │ P10 │ MRR │ nDCG5 │ nDCG10 │
├─────────┼─────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0 │ 'db-vector' │ 65 │ '0.8231' │ '0.9692' │ '0.9846' │ '1.0000' │ '0.2000' │ '0.1015' │ '0.8928' │ '0.9140' │ '0.9195' │
└─────────┴─────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
=== Financial Law GENERATION EVALUATION ===
┌─────────┬─────────┬─────────────┬──────────────┬─────────────────────┬──────────┐
│ (index) │ queries │ correctness │ faithfulness │ citationCorrectness │ passRate │
├─────────┼─────────┼─────────────┼──────────────┼─────────────────────┼──────────┤
│ 0 │ 65 │ '0.9831' │ '0.9908' │ '1.0000' │ '1.0000' │
└─────────┴─────────┴─────────────┴──────────────┴─────────────────────┴──────────┘
============================================================
EGYPTIAN FINANCIAL LAW RAGAS EVALUATION
============================================================
Queries: 65
Faithfulness: 0.9821
Answer Relevancy: 0.8713
Context Precision: 0.7959
Context Relevance: 0.9808
============================================================
============================================================
RAGAS FINANCIAL LAW FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC
============================================================
Queries: 65
Faithfulness: 0.9897
Low-faithfulness: 1
Threshold: 0.60
============================================================

====================================================================================================
RAGAS FAITHFULNESS CLAIM-LEVEL INSPECTOR
====================================================================================================
Threshold: 0.60 | Cases: 1

---

financial-042 | faithfulness=0.5000 | claims=2 | supported=1 | unsupported=1
Question: على أي أساس تُحدد الدفعات التي تحصلها الجهة الإدارية مقدماً؟
Answer: يُرعى في تقدير المعدل الخاص بالدفعات التي تحصلها الجهة الإدارية على سبيل المعجل من الموعد المحدد أن يكون محسوباً على أساس سعر الخزانة والخصم الساري المعلن من البنك المركزي في التاريخ المحدد للتوريد أو تسوية تلك البيعها أعلى، على ألا يكون هناك نقص في قوانين أخرى مقابل أعلى [1].

Claim 1 [SUPPORTED]
Statement: يتم تقدير المعدل الخاص بالدفعات التي تحصلها الجهة الإدارية على سبيل المعجل من الموعد المحدد على أساس سعر الخزانة والخصم الساري المعلن من البنك المركزي في التاريخ المحدد للتوريد أو تسوية تلك البيعها أعلى.
Reason: This statement is directly supported by the text of Article (44), which specifies that the rate for accelerated payments is calculated based on the Treasury rate and the discount rate announced by the Central Bank on the specified date of supply or settlement.

Claim 2 [UNSUPPORTED]
Statement: يجب ألا يكون هناك نقص في قوانين أخرى مقابل أعلى عند تقدير المعدل الخاص بالدفعات التي تحصلها الجهة الإدارية.
Reason: While the text of Article (44) contains a fragmented sentence mentioning 'نقص قوانين أخرى بقى Frederic مقابل أعلى', it is grammatically incoherent and does not clearly establish a mandatory requirement or a logical rule that can be directly inferred as a legal obligation.

====================================================================================================

============================================================
LABOUR LAW VECTOR RETRIEVAL BENCHMARK
============================================================

┌─────────┬──────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ (index) │ system │ R@1 │ R@3 │ R@5 │ R@10 │ P@5 │ P@10 │ Hit@1 │ Hit@3 │ Hit@5 │ Hit@10 │ MRR │ nDCG@5 │ nDCG@10 │
├─────────┼──────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 0 │ 'db-vector' │ '0.8308' │ '0.9615' │ '0.9923' │ '0.9923' │ '0.2000' │ '0.1000' │ '0.8308' │ '0.9692' │ '1.0000' │ '1.0000' │ '0.9044' │ '0.9249' │ '0.9249' │
│ 1 │ 'db-vector-reranked' │ '0.7846' │ '0.9077' │ '0.9615' │ '0.9692' │ '0.1938' │ '0.0985' │ '0.7846' │ '0.9077' │ '0.9692' │ '0.9692' │ '0.8582' │ '0.8838' │ '0.8868' │
└─────────┴──────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

============================================================
LABOUR LAW CONTEXT EVALUATION
============================================================

┌─────────┬──────────────────────┬──────────┬─────────────┬───────────┐
│ (index) │ system │ C-Recall │ C-Precision │ C-HitRate │
├─────────┼──────────────────────┼──────────┼─────────────┼───────────┤
│ 0 │ 'db-vector' │ '0.9923' │ '0.1000' │ '1.0000' │
│ 1 │ 'db-vector-reranked' │ '0.9692' │ '0.0985' │ '0.9692' │
└─────────┴──────────────────────┴──────────┴─────────────┴───────────┘

============================================================
LABOUR LAW GENERATION EVALUATION
============================================================

┌─────────┬──────────────────────┬─────────┬─────────────┬──────────────┬─────────────────────┬──────────┐
│ (index) │ system │ queries │ correctness │ faithfulness │ citationCorrectness │ passRate │
├─────────┼──────────────────────┼─────────┼─────────────┼──────────────┼─────────────────────┼──────────┤
│ 0 │ 'db-vector' │ 65 │ '1.0000' │ '1.0000' │ '1.0000' │ '1.0000' │
│ 1 │ 'db-vector-reranked' │ 65 │ '0.9877' │ '0.9969' │ '0.9923' │ '0.9692' │
└─────────┴──────────────────────┴─────────┴─────────────┴──────────────┴─────────────────────┴──────────┘

============================================================
LABOUR LAW GENERATION CONFIGURATION
============================================================

┌─────────┬─────────────────┬────────────────┬───────────────────────┬──────────────────┬───────────────┐
│ (index) │ generationModel │ judgeModel │ generationConcurrency │ judgeConcurrency │ passThreshold │
├─────────┼─────────────────┼────────────────┼───────────────────────┼──────────────────┼───────────────┤
│ 0 │ 'gemma4:cloud' │ 'gemma4:cloud' │ 3 │ 3 │ 0.7 │
└─────────┴─────────────────┴────────────────┴───────────────────────┴──────────────────┴───────────────┘

============================================================
LABOUR LAW RETRIEVAL DIAGNOSTIC SUMMARY
============================================================

┌─────────┬──────────────────────┬──────────────────────────┬───────────────┐
│ (index) │ system │ queriesWithRelevantTop10 │ queriesMissed │
├─────────┼──────────────────────┼──────────────────────────┼───────────────┤
│ 0 │ 'db-vector' │ 65 │ 0 │
│ 1 │ 'db-vector-reranked' │ 63 │ 2 │
└─────────┴──────────────────────┴──────────────────────────┴───────────────┘
============================================================
EGYPTIAN LABOUR LAW RAGAS EVALUATION
============================================================
Queries: 65
Faithfulness: 0.9765
Answer Relevancy: 0.8588
Context Precision: 0.8531
Context Relevance: 0.9654
============================================================
============================================================
RAGAS LABOUR LAW FAITHFULNESS CLAIM-LEVEL DIAGNOSTIC
============================================================
Queries: 65
Faithfulness: 0.9867
Low-faithfulness: 0
Threshold: 0.60
============================================================
