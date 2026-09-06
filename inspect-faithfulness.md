npm run ragas:inspect-faithfulness

> Egyptian Legislation RAG@2.0.0 ragas:inspect-faithfulness
> python evaluation/ragas/inspect-faithfulness.py

====================================================================================================
RAGAS FAITHFULNESS CLAIM-LEVEL INSPECTOR
====================================================================================================
Threshold: 0.60 | Cases: 17

---

labour-032 | faithfulness=0.0000 | claims=6 | supported=0 | unsupported=6
Question: على من تسري أحكام باب التدريب والتشغيل؟
Answer: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على جميع مراكز التدريب الخاضعة لأحكام هذا القانون [1]، وعلى الفئات التالية [1]:

1. الراغبين في التدريب.
2. الأشخاص ذوو الإعاقة والأقزام، والفئات الأولى بالرعاية.
3. المتدرجين.
4. الراغبين في التأهيل المهني الأعلى أو المستمر.
5. عمال التلمذة الصناعية.

Claim 1 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على جميع مراكز التدريب الخاضعة لأحكام القانون رقم 14 لسنة 2025.
Reason: While Article (16) states that the provisions apply to all training centers subject to the law, the context does not explicitly mention that the law is 'Law No. 14 of 2025'. It only mentions the date of the Official Gazette as May 3, 2025.

Claim 2 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على الراغبين في التدريب.
Reason: Article (16) explicitly lists 'those wishing to be trained' (الراغبين في التدريب) as a category the provisions apply to, but the context does not specify the law number as 'Law No. 14 of 2025'.

Claim 3 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على الأشخاص ذوي الإعاقة والأقزام والفئات الأولى بالرعاية.
Reason: Article (16) explicitly lists 'persons with disabilities, dwarfs, and categories priority for care' as a category the provisions apply to, but the context does not specify the law number as 'Law No. 14 of 2025'.

Claim 4 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على المتدرجين.
Reason: Article (16) explicitly lists 'apprentices' (المتدرجين) as a category the provisions apply to, but the context does not specify the law number as 'Law No. 14 of 2025'.

Claim 5 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على الراغبين في التأهيل المهني الأعلى أو المستمر.
Reason: Article (16) explicitly lists 'those wishing for higher or continuous vocational rehabilitation' as a category the provisions apply to, but the context does not specify the law number as 'Law No. 14 of 2025'.

Claim 6 [UNSUPPORTED]
Statement: تسري أحكام باب التدريب والتشغيل وفقاً للمادة (16) من القانون رقم 14 لسنة 2025 على عمال التلمذة الصناعية.
Reason: Article (16) explicitly lists 'industrial apprenticeship workers' as a category the provisions apply to, but the context does not specify the law number as 'Law No. 14 of 2025'.

---

labour-055 | faithfulness=0.0000 | claims=4 | supported=0 | unsupported=4
Question: هل يجوز للمنشأة تشغيل عمال عن طريق متعهد أو مقاول توريد عمال؟
Answer: لا يجوز للمنشآت تشغيل عمال عن طريق متعهد أو مقاول توريد عمال، وذلك وفقاً للمادة (45) من قانون العمل رقم 14 لسنة 2025، مع مراعاة حكم المادة (40) من ذات القانون [1].

علماً بأن هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [UNSUPPORTED]
Statement: لا يجوز للمنشآت تشغيل عمال عن طريق متعهد أو مقاول توريد عمال وفقاً للمادة (45) من قانون العمل رقم 14 لسنة 2025.
Reason: The context explicitly states in Article (45) that establishments may not employ workers through a contractor or a labor supply contractor. However, the context does not mention that the law is 'Law No. 14 of 2025'; it only mentions the date of the Official Gazette as May 3, 2025.

Claim 2 [UNSUPPORTED]
Statement: يجب مراعاة حكم المادة (40) من قانون العمل رقم 14 لسنة 2025 عند تطبيق حظر تشغيل العمال عن طريق متعهد أو مقاول توريد عمال.
Reason: Article (45) explicitly starts with 'Taking into account the provision of Article (40) of this law', confirming the requirement to consider Article (40). However, as with the previous statement, the specific law number 'Law No. 14 of 2025' is not mentioned in the provided text.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: This is a meta-statement about the source of the answer, not a fact that can be inferred from the legal text provided in the context.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: This is a legal disclaimer and is not mentioned or inferable from the provided legal text.

---

labour-065 | faithfulness=0.0000 | claims=6 | supported=0 | unsupported=6
Question: ما الحد الأقصى لساعات تشغيل الطفل يومياً؟
Answer: الحد الأقصى لساعات تشغيل الطفل هو ست ساعات يومياً، وفقاً لما نصت عليه المادة (65) من القانون رقم 14 لسنة 2025 [2].

توضيح للنص القانوني: يحظر القانون تشغيل الطفل أكثر من هذه المدة، كما يمنع تشغيله في ساعات عمل إضافية، أو في أيام الراحة الأسبوعية والعطلات الرسمية، ويحظر تشغيله في الفترة ما بين الساعة السابعة مساءً والسابعة صباحاً [2].

تنويه: هذه الإجابة ليست استشارة قانونية ملزمة.

Claim 1 [UNSUPPORTED]
Statement: الحد الأقصى لساعات تشغيل الطفل هو ست ساعات يومياً وفقاً للمادة (65) من القانون رقم 14 لسنة 2025.
Reason: While Article (65) does state that children cannot work more than six hours a day, the provided context does not mention that this is 'Law No. 14 of 2025'.

Claim 2 [UNSUPPORTED]
Statement: يحظر القانون رقم 14 لسنة 2025 تشغيل الطفل لأكثر من ست ساعات يومياً.
Reason: The context prohibits children from working more than six hours a day in Article (65), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 3 [UNSUPPORTED]
Statement: يمنع القانون رقم 14 لسنة 2025 تشغيل الطفل في ساعات عمل إضافية.
Reason: The context prohibits children from working overtime hours in Article (65), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 4 [UNSUPPORTED]
Statement: يمنع القانون رقم 14 لسنة 2025 تشغيل الطفل في أيام الراحة الأسبوعية والعطلات الرسمية.
Reason: The context prohibits children from working on weekly rest days and official holidays in Article (65), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 5 [UNSUPPORTED]
Statement: يحظر القانون رقم 14 لسنة 2025 تشغيل الطفل في الفترة ما بين الساعة السابعة مساءً والسابعة صباحاً.
Reason: The context prohibits children from working between 7 PM and 7 AM in Article (65), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 6 [UNSUPPORTED]
Statement: هذه الإجابة ليست استشارة قانونية ملزمة.
Reason: The provided context consists of legal articles and does not contain any disclaimer stating that the answer is not binding legal advice.

---

labour-063 | faithfulness=0.1667 | claims=6 | supported=1 | unsupported=5
Question: ما الحد الأقصى لمدة الإجازة دون أجر لرعاية طفل العاملة؟
Answer: بناءً على النصوص القانونية المقدمة، فإن الحد الأقصى لمدة الإجازة دون أجر لرعاية طفل العاملة هو مدة لا تجاوز ستين يوماً [1].

**التفاصيل القانونية وفقاً للمادة (57) من القانون رقم 14 لسنة 2025:**

- يُشترط لاستحقاق هذه الإجازة أن تكون العاملة في منشأة تستخدم خمسين عاملاً فأكثر [1].
- يجب أن يكون قد مر على وجود العاملة في المنشأة سنة على الأقل [1].
- لا تستحق هذه الإجازة لأكثر من ثلاث مرات طوال مدة الخدمة [1].
- يجب ألا تقل المدة بين الإجازة الأولى والثانية عن سنتين [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: الحد الأقصى لمدة الإجازة دون أجر لرعاية طفل العاملة هو مدة لا تجاوز ستين يوماً وفقاً للنصوص القانونية المقدمة.
Reason: The text of Article (57) explicitly states that the female worker has the right to an unpaid leave for a period not exceeding sixty days to care for her child.

Claim 2 [UNSUPPORTED]
Statement: يشترط لاستحقاق إجازة رعاية طفل العاملة أن تكون العاملة في منشأة تستخدم خمسين عاملاً فأكثر وفقاً للمادة (57) من القانون رقم 14 لسنة 2025.
Reason: While Article (57) does mention the requirement of the establishment employing 50 workers or more, the provided context does not mention 'Law No. 14 of 2025'; it only mentions the Official Gazette date of May 3, 2025.

Claim 3 [UNSUPPORTED]
Statement: يشترط لاستحقاق إجازة رعاية طفل العاملة أن يكون قد مر على وجود العاملة في المنشأة سنة على الأقل وفقاً للمادة (57) من القانون رقم 14 لسنة 2025.
Reason: Article (57) does require that the worker has been in the establishment for at least one year, but the context does not identify the law as 'Law No. 14 of 2025'.

Claim 4 [UNSUPPORTED]
Statement: لا تستحق إجازة رعاية طفل العاملة لأكثر من ثلاث مرات طوال مدة الخدمة وفقاً للمادة (57) من القانون رقم 14 لسنة 2025.
Reason: Article (57) states that this leave is not entitled to more than three times during the service period, but the context does not specify the law as 'Law No. 14 of 2025'.

Claim 5 [UNSUPPORTED]
Statement: يجب ألا تقل المدة بين الإجازة الأولى والثانية لرعاية طفل العاملة عن سنتين وفقاً للمادة (57) من القانون رقم 14 لسنة 2025.
Reason: Article (57) specifies that the period between the first and second leave must not be less than two years, but the context does not identify the law as 'Law No. 14 of 2025'.

Claim 6 [UNSUPPORTED]
Statement: الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This is a meta-statement about the nature of the response and is not a fact that can be inferred from the provided legal text itself.

---

labour-021 | faithfulness=0.2000 | claims=5 | supported=1 | unsupported=4
Question: كيف تُحسب السنة والشهر في تطبيق أحكام قانون العمل؟
Answer: وفقاً للمادة رقم (2) من القانون رقم 14 لسنة 2025، يتم حساب السنة والشهر في تطبيق أحكام هذا القانون على النحو التالي:

- تعتبر السنة (365) يوماً [1].
- يعتبر الشهر ثلاثين يوماً [1].

وذلك ما لم يتم الاتفاق على خلاف ذلك [1].

_هذه الإجابة تستند إلى النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة._

Claim 1 [UNSUPPORTED]
Statement: وفقاً للمادة رقم (2) من القانون رقم 14 لسنة 2025، يتم حساب السنة والشهر في تطبيق أحكام القانون رقم 14 لسنة 2025 على النحو التالي.
Reason: The context mentions 'Article (2)' and the date 'May 3, 2025' in the official gazette, but it does not explicitly state that the law is 'Law No. 14 of 2025'.

Claim 2 [UNSUPPORTED]
Statement: تعتبر السنة (365) يوماً في تطبيق أحكام القانون رقم 14 لسنة 2025.
Reason: While the context states that the year is 365 days in the application of the law's provisions, it does not specify that the law is 'Law No. 14 of 2025'.

Claim 3 [UNSUPPORTED]
Statement: يعتبر الشهر ثلاثين يوماً في تطبيق أحكام القانون رقم 14 لسنة 2025.
Reason: While the context states that the month is 30 days in the application of the law's provisions, it does not specify that the law is 'Law No. 14 of 2025'.

Claim 4 [SUPPORTED]
Statement: يتم حساب السنة والشهر كما ذكر ما لم يتم الاتفاق على خلاف ذلك.
Reason: The context explicitly states in Article (2) that the year is 365 days and the month is 30 days 'unless otherwise agreed upon' (ما لم يتم الاتفاق علي خلاف ذلك).

Claim 5 [UNSUPPORTED]
Statement: هذه الإجابة تستند إلى النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This is a disclaimer statement and is not mentioned or inferable from the provided legal text context.

---

labour-018 | faithfulness=0.3333 | claims=3 | supported=1 | unsupported=2
Question: ما المقصود بالأجر الأساسي في قانون العمل؟
Answer: المقصود بالأجر الأساسي وفقاً للمادة (1) من قانون العمل رقم 14 لسنة 2025 هو: "الأجر المنصوص عليه في عقد العمل، وما يطرأ عليه من علاوات" [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: الأجر الأساسي وفقاً للمادة (1) من قانون العمل رقم 14 لسنة 2025 هو الأجر المنصوص عليه في عقد العمل وما يطرأ عليه من علاوات.
Reason: The context in Article (1) explicitly defines 'الاجر الاساسي' (Basic Wage) as 'الاجر المنصوص عليه في عقد العمل ، وما يطرا عليه من علاوات'. Although the context doesn't explicitly name the law as 'Law No. 14 of 2025', the definition itself is directly present.

Claim 2 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة.
Reason: This is a meta-statement about the source of the information. While the information provided in the context is indeed legal text, the statement itself is not a fact contained within the provided text to be inferred, but rather a description of the process.

Claim 3 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context consists of legal articles and definitions; it does not contain any disclaimer stating that the answers provided do not constitute binding legal advice.

---

labour-026 | faithfulness=0.4286 | claims=7 | supported=3 | unsupported=4
Question: هل تُعفى الدعاوى العمالية من الرسوم والمصاريف القضائية؟
Answer: نعم، تُعفى بعض الدعاوى العمالية من الرسوم والمصاريف القضائية وفقاً للتالي:

**النص القانوني:**
تنص المادة (7) من القانون رقم 14 لسنة 2025 على أنه: "تعفي من الرسوم والمصاريف القضايية في جميع مراحل التقاضي الدعاوي الناشية عن المنازعات المتعلقة باحكام هذا القانون ، التي يرفعها العاملون والمتدرجون ، وعمال التلمذة الصناعية ، او المستحقون عن هولاء" [1].

**تفسير النص:**
يقتصر الإعفاء من الرسوم والمصاريف القضائية في جميع مراحل التقاضي على الدعاوى الناشئة عن منازعات تطبيق هذا القانون بشرط أن يكون رافع الدعوى أحد الفئات التالية: (العاملون، المتدرجون، عمال التلمذة الصناعية، أو المستحقون عنهم) [1].

ومع ذلك، يمنح القانون للمحكمة في حالة رفض الدعوى الحق في أن تحكم على رافعها بمصروفات الدعوى كلها أو بعضها [1].

**تنبيه:** هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: Some labor lawsuits are exempt from judicial fees and expenses.
Reason: Article (7) explicitly states that lawsuits arising from disputes related to the provisions of this law, filed by workers, trainees, and industrial apprenticeship workers, are exempt from judicial fees and expenses.

Claim 2 [UNSUPPORTED]
Statement: Article (7) of Law No. 14 of 2025 states that lawsuits arising from disputes related to the provisions of Law No. 14 of 2025 are exempt from judicial fees and expenses at all stages of litigation.
Reason: While Article (7) does state the exemption for lawsuits related to the law's provisions, the provided context does not explicitly name the law as 'Law No. 14 of 2025'; it only mentions the date of the Official Gazette as May 3, 2025.

Claim 3 [SUPPORTED]
Statement: The exemption from judicial fees and expenses applies to lawsuits filed by workers, trainees, industrial apprenticeship workers, or those entitled to receive benefits on their behalf.
Reason: This is directly stated in Article (7): 'تعفي من الرسوم والمصاريف القضايية... الدعاوي... التي يرفعها العاملون والمتدرجون ، وعمال التلمذة الصناعية ، او المستحقون عن هولاء'.

Claim 4 [UNSUPPORTED]
Statement: The exemption from judicial fees and expenses in all stages of litigation is limited to lawsuits arising from disputes over the application of Law No. 14 of 2025.
Reason: The context mentions the exemption for disputes related to 'this law', but it does not explicitly state that it is 'limited' only to these, nor does it identify the law as 'Law No. 14 of 2025'.

Claim 5 [SUPPORTED]
Statement: The exemption from judicial fees and expenses requires the plaintiff to be a worker, a trainee, an industrial apprenticeship worker, or a person entitled to receive benefits on their behalf.
Reason: Article (7) specifies that the exemption applies to lawsuits raised by these specific categories of people.

Claim 6 [UNSUPPORTED]
Statement: Law No. 14 of 2025 grants the court the right to order the plaintiff to pay all or part of the lawsuit expenses if the lawsuit is rejected.
Reason: Article (7) states that the court may order the plaintiff to pay expenses if the lawsuit is rejected, but the context does not explicitly identify the law as 'Law No. 14 of 2025'.

Claim 7 [UNSUPPORTED]
Statement: The provided answer is derived from the provided texts and does not represent binding legal advice.
Reason: This statement is a meta-commentary or disclaimer and is not mentioned anywhere within the provided legal text context.

---

labour-061 | faithfulness=0.4286 | claims=7 | supported=3 | unsupported=4
Question: ما حق العاملة في العودة إلى العمل بعد انتهاء إجازة الوضع؟
Answer: بناءً على النصوص القانونية المقدمة، فإن حق العاملة في العودة إلى العمل بعد انتهاء إجازة الوضع هو كالتالي:

**النص القانوني:**
تنص المادة (55) من القانون رقم 14 لسنة 2025 على أنه: "للعاملة بعد انتهاء اجازة الوضع المبينة بالمادة (54) من هذا القانون الحق في العودة الي وظيفتها او وظيفة مماثلة لها دون الاخلال باية مزايا كانت مقررة لوظيفتها الاصلية" [1].

**تفسير النص:**
يمنح القانون العاملة الحق في استعادة وظيفتها الأصلية أو الحصول على وظيفة مماثلة لها عند عودتها من إجازة الوضع، مع ضمان الحفاظ على كافة المزايا التي كانت مقررة لوظيفتها الأصلية [1].

كما أضافت المادة (55) ضمانات إضافية لحماية العاملة، حيث:

- يحظر فصل العاملة أو إنهاء خدمتها أثناء إجازة الوضع [1].
- يحظر فصلها أو إنهاء خدمتها عقب عودتها من هذه الإجازة، إلا إذا أثبت صاحب العمل أن الفصل أو إنهاء الخدمة كان لسبب مشروع [1].

يرجى العلم أن هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [UNSUPPORTED]
Statement: تنص المادة (55) من القانون رقم 14 لسنة 2025 على أن للعاملة الحق في العودة إلى وظيفتها أو وظيفة مماثلة لها بعد انتهاء إجازة الوضع المبينة بالمادة (54) من القانون رقم 14 لسنة 2025.
Reason: While Article (55) does state the right to return to the job or a similar one, the provided context does not mention that the law is 'Law No. 14 of 2025'. It only mentions the date of the Official Gazette as May 3, 2025.

Claim 2 [UNSUPPORTED]
Statement: تضمن المادة (55) من القانون رقم 14 لسنة 2025 عدم الإخلال بأية مزايا كانت مقررة لوظيفة العاملة الأصلية عند عودتها من إجازة الوضع.
Reason: Similar to the first statement, the context confirms the content of Article (55) regarding benefits, but it does not specify the law's number as 'Law No. 14 of 2025'.

Claim 3 [SUPPORTED]
Statement: يمنح القانون العاملة الحق في استعادة وظيفتها الأصلية أو الحصول على وظيفة مماثلة لها عند العودة من إجازة الوضع.
Reason: This is directly stated in Article (55): 'للعاملة بعد انتهاء اجازة الوضع المبينة بالمادة (54) من هذا القانون الحق في العودة الي وظيفتها او وظيفة مماثلة لها'.

Claim 4 [SUPPORTED]
Statement: يضمن القانون الحفاظ على كافة المزايا التي كانت مقررة لوظيفة العاملة الأصلية عند العودة من إجازة الوضع.
Reason: This is directly stated in Article (55): 'دون الاخلال باية مزايا كانت مقررة لوظيفتها الاصلية'.

Claim 5 [UNSUPPORTED]
Statement: تحظر المادة (55) من القانون رقم 14 لسنة 2025 فصل العاملة أو إنهاء خدمة العاملة أثناء إجازة الوضع.
Reason: The context confirms the prohibition of dismissal during maternity leave in Article (55), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 6 [UNSUPPORTED]
Statement: تحظر المادة (55) من القانون رقم 14 لسنة 2025 فصل العاملة أو إنهاء خدمة العاملة عقب العودة من إجازة الوضع.
Reason: The context confirms the prohibition of dismissal after returning from leave in Article (55), but it does not identify the law as 'Law No. 14 of 2025'.

Claim 7 [SUPPORTED]
Statement: يجوز فصل العاملة أو إنهاء خدمة العاملة عقب العودة من إجازة الوضع إذا أثبت صاحب العمل أن الفصل أو إنهاء الخدمة كان لسبب مشروع.
Reason: This is directly stated in Article (55): 'كما يحظر فصلها او انهاء خدمتها عقب عودتها من هذه الاجازة ، ما لم يثبت صاحب العمل ان الفصل او انهاء الخدمة لسبب مشروع'.

---

labour-002 | faithfulness=0.5000 | claims=2 | supported=1 | unsupported=1
Question: كم مرة يجوز تعيين العامل تحت الاختبار لدى صاحب عمل واحد؟
Answer: لا يجوز تعيين العامل تحت الاختبار أكثر من مرة واحدة لدى صاحب عمل واحد، وذلك وفقاً للمادة (90) من القانون رقم 14 لسنة 2025 [1].

Claim 1 [SUPPORTED]
Statement: لا يجوز تعيين العامل تحت الاختبار أكثر من مرة واحدة لدى صاحب عمل واحد.
Reason: This statement is explicitly mentioned in Article (90) of the provided text: 'ولا يجوز تعيين العامل تحت الاختبار اكثر من مرة واحدة لدي صاحب عمل واحد'.

Claim 2 [UNSUPPORTED]
Statement: حظر تعيين العامل تحت الاختبار أكثر من مرة واحدة لدى صاحب عمل واحد جاء وفقاً للمادة (90) من القانون رقم 14 لسنة 2025.
Reason: While the text mentions Article (90) and the date May 3, 2025, it does not explicitly state that the law is 'Law No. 14 of 2025'.

---

labour-012 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: ما مدة الاحتفاظ بملف العامل بعد انتهاء علاقة العمل؟
Answer: وفقاً للمادة (92) من القانون رقم 14 لسنة 2025، يجب على صاحب العمل الاحتفاظ بملف العامل (سواء كان ورقياً أو إلكترونياً) لمدة خمس سنوات على الأقل تبدأ من تاريخ انتهاء علاقة العمل [1].

أما في حالة وجود نزاع قضائي، فيجب الاحتفاظ بالملف في جميع الأحوال لحين الفصل في الدعوى بحكم بات [1].

هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [UNSUPPORTED]
Statement: وفقاً للمادة (92) من القانون رقم 14 لسنة 2025، يجب على صاحب العمل الاحتفاظ بملف العامل لمدة خمس سنوات على الأقل تبدأ من تاريخ انتهاء علاقة العمل.
Reason: While Article (92) does state that the employer must keep the worker's file for at least five years from the date the employment relationship ends, the provided context does not mention that this is 'Law No. 14 of 2025'.

Claim 2 [SUPPORTED]
Statement: يمكن أن يكون ملف العامل الذي يحتفظ به صاحب العمل ورقياً أو إلكترونياً.
Reason: Article (92) explicitly states that the employer must create a file that is either 'paper or electronic' (ملفا ورقيا او الكترونيا).

Claim 3 [SUPPORTED]
Statement: في حالة وجود نزاع قضائي، يجب على صاحب العمل الاحتفاظ بملف العامل لحين الفصل في الدعوى بحكم بات.
Reason: Article (92) explicitly states: 'In all cases, the file must be kept when there is a judicial dispute until the lawsuit is decided by a final judgment' (وفي جميع الاحوال يجب الاحتفاظ بالملف عند وجود نزاع قضايي لحين الفصل في الدعوي بحكم بات).

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This statement is a disclaimer about the nature of the response and is not a fact mentioned or inferable from the provided legal text context.

---

labour-020 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: ما المقصود بالعامل غير المنتظم؟
Answer: المقصود بالعامل غير المنتظم وفقاً للمادة (1) من القانون رقم 14 لسنة 2025 هو: كل من يقوم بأداء عمل غير دائم بطبيعته مقابل أجر أياً كانت صورته، أو يعمل في مهنة أو حرفة لا ينظمها قانون خاص، ومثال على ذلك موزعي الصحف والباعة الجائلين وغيرهم [1].

Claim 1 [UNSUPPORTED]
Statement: العامل غير المنتظم وفقاً للمادة (1) من القانون رقم 14 لسنة 2025 هو كل من يقوم بأداء عمل غير دائم بطبيعته مقابل أجر أياً كانت صورته.
Reason: The context in Article (1), point 9, explicitly defines the irregular worker (العامل غير المنتظم) as someone who performs work that is not permanent by nature in exchange for a wage of any form. However, the context does not mention a 'Law No. 14 of 2025', only the date of the Official Gazette.

Claim 2 [UNSUPPORTED]
Statement: العامل غير المنتظم وفقاً للمادة (1) من القانون رقم 14 لسنة 2025 هو كل من يعمل في مهنة أو حرفة لا ينظمها قانون خاص.
Reason: The context in Article (1), point 9, defines the irregular worker as someone who works in a profession or craft not regulated by a special law. However, the context does not mention a 'Law No. 14 of 2025'.

Claim 3 [SUPPORTED]
Statement: موزعو الصحف يعتبرون مثالاً على العامل غير المنتظم.
Reason: Article (1), point 9, explicitly lists newspaper distributors (موزعي الصحف) as an example of irregular workers.

Claim 4 [SUPPORTED]
Statement: الباعة الجائلون يعتبرون مثالاً على العامل غير المنتظم.
Reason: Article (1), point 9, explicitly lists street vendors (الباعة الجائلين) as an example of irregular workers.

---

labour-030 | faithfulness=0.5000 | claims=6 | supported=3 | unsupported=3
Question: هل يؤدي انتقال ملكية المنشأة أو إدماجها إلى إنهاء عقود عمل العاملين بها؟
Answer: لا، لا يؤدي انتقال ملكية المنشأة أو إدماجها إلى إنهاء عقود عمل العاملين بها.

وفقاً للمادة (11) من القانون رقم 14 لسنة 2025، فإنه لا يترتب على إدماج المنشأة، أو تقسيمها، أو انتقالها (سواء كان ذلك عن طريق الإرث، أو الوصية، أو الهبة، أو البيع ولو كان بالمزاد العلني، أو النزول، أو الإيجار، أو غير ذلك من التصرفات) إنهاء عقود استخدام عمال المنشأة [2].

كما نصت المادة ذاتها على أن الخلف يكون مسؤولاً بالتضامن مع أصحاب الأعمال السابقين عن تنفيذ كافة الالتزامات الناشئة عن هذه العقود [2].

وبناءً على تفسير النصوص المذكورة، فإن حقوق العامل ومزاياه تظل قائمة حتى في حالة تغيير الكيان القانوني للمنشأة أو انتقال ملكيتها [3].

_تنويه: هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة._

Claim 1 [SUPPORTED]
Statement: انتقال ملكية المنشأة أو إدماجها لا يؤدي إلى إنهاء عقود عمل العاملين بالمنشأة.
Reason: This is directly stated in Article (11), which mentions that merging, dividing, or transferring the establishment does not result in the termination of employment contracts.

Claim 2 [UNSUPPORTED]
Statement: وفقاً للمادة (11) من القانون رقم 14 لسنة 2025، لا يترتب على إدماج المنشأة أو تقسيمها أو انتقالها إنهاء عقود استخدام عمال المنشأة.
Reason: While the content of Article (11) matches, the context does not explicitly state that the law is 'Law No. 14 of 2025'; it only mentions the date of the Official Gazette as May 3, 2025.

Claim 3 [SUPPORTED]
Statement: يشمل انتقال ملكية المنشأة الانتقال عن طريق الإرث، أو الوصية، أو الهبة، أو البيع ولو كان بالمزاد العلني، أو النزول، أو الإيجار، أو غير ذلك من التصرفات.
Reason: This is explicitly listed in Article (11) as the methods of transfer that do not terminate employment contracts.

Claim 4 [UNSUPPORTED]
Statement: تنص المادة (11) من القانون رقم 14 لسنة 2025 على أن الخلف يكون مسؤولاً بالتضامن مع أصحاب الأعمال السابقين عن تنفيذ كافة الالتزامات الناشئة عن عقود العمل.
Reason: Similar to the second statement, while the legal rule is present in Article (11), the context does not identify the law as 'Law No. 14 of 2025'.

Claim 5 [SUPPORTED]
Statement: تظل حقوق العامل ومزاياه قائمة في حالة تغيير الكيان القانوني للمنشأة أو انتقال ملكيتها بناءً على تفسير النصوص القانونية المذكورة.
Reason: Article (6) explicitly states that better advantages or conditions continue to apply in the case of changing the legal entity of the establishment or the transfer of its ownership.

Claim 6 [UNSUPPORTED]
Statement: هذه الإجابة مستمدة من النصوص القانونية المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This is a meta-statement/disclaimer and is not mentioned anywhere within the provided legal context.

---

labour-037 | faithfulness=0.5000 | claims=6 | supported=3 | unsupported=3
Question: هل يلزم الحصول على ترخيص من الوزارة المختصة لمزاولة عمليات التدريب؟
Answer: نعم، يشترط لمزاولة عمليات التدريب الحصول على ترخيص من الوزارة المختصة، وذلك وفقاً للتالي:

**النص القانوني:**

- تنص المادة (23) من القانون رقم 14 لسنة 2025 على أنه: "يشترط لمزاولة عمليات التدريب الحصول علي ترخيص من الوزارة المختصة باستثناء الجهات المنصوص عليها في البندين (2، 3) من المادة (22) من هذا القانون" [1].

**تفسير النص:**
يلزم الحصول على ترخيص من الوزارة المختصة لممارسة عمليات التدريب، إلا أن هذا الشرط لا ينطبق على الجهات المذكورة في البندين (2 و 3) من المادة (22) من ذات القانون [1]. كما أشارت النصوص إلى وجوب حصول المدربين الذين يزاولون أعمال التدريب على ترخيص من الوزارة المختصة، مع استثناء المدربين التابعين للجهات المنصوص عليها في البندين (2، 3) من المادة (22) إذا كان تدريبهم يقتصر على هذه الجهات فقط [5].

**ملاحظة:** هذه الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: يشترط لمزاولة عمليات التدريب الحصول على ترخيص من الوزارة المختصة.
Reason: This is explicitly stated in Article (23): 'يشترط لمزاولة عمليات التدريب الحصول علي ترخيص من الوزارة المختصة'.

Claim 2 [UNSUPPORTED]
Statement: تنص المادة (23) من القانون رقم 14 لسنة 2025 على وجوب الحصول على ترخيص من الوزارة المختصة لمزاولة عمليات التدريب.
Reason: While Article (23) does require a license, the provided context does not mention that the law is 'Law No. 14 of 2025'; it only mentions the date of the Official Gazette (May 3, 2025).

Claim 3 [UNSUPPORTED]
Statement: يستثنى من شرط الحصول على ترخيص لمزاولة عمليات التدريب الجهات المنصوص عليها في البندين (2 و 3) من المادة (22) من القانون رقم 14 لسنة 2025.
Reason: The context confirms the exception for entities in items (2, 3) of Article (22), but it does not specify the law number as 'Law No. 14 of 2025'.

Claim 4 [SUPPORTED]
Statement: يلزم المدربون الذين يزاولون أعمال التدريب الحصول على ترخيص من الوزارة المختصة.
Reason: This is explicitly stated in Article (25): 'يشترط في المدربين الذين يزاولون اعمال التدريب ان يرخص لهم بذلك من الوزارة المختصة'.

Claim 5 [SUPPORTED]
Statement: يستثنى من شرط الحصول على ترخيص المدربون التابعون للجهات المنصوص عليها في البندين (2 و 3) من المادة (22) إذا كان تدريب هؤلاء المدربين يقتصر على تلك الجهات فقط.
Reason: This is explicitly stated in Article (25): 'علي ان يستثني من ذلك المدربون التابعون للجهات المنصوص عليها في البندين (2 ، 3) من المادة (22) من هذا القانون ، اذا اقتصر عملهم بالتدريب داخل هذه الجهات دون غيرها'.

Claim 6 [UNSUPPORTED]
Statement: الإجابة مستمدة من النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This statement is a disclaimer and is not mentioned anywhere in the provided legal text context.

---

labour-042 | faithfulness=0.5000 | claims=2 | supported=1 | unsupported=1
Question: ما الحد الأدنى لسن المتدرج؟
Answer: يُشترط في المتدرج ألا يقل سنه عن أربعة عشر عاماً، وذلك وفقاً لما نصت عليه المادة (28) من القانون رقم 14 لسنة 2025 [4].

Claim 1 [SUPPORTED]
Statement: يُشترط في المتدرج ألا يقل سنه عن أربعة عشر عاماً.
Reason: This is explicitly stated in Article (28) of the provided text: 'يشترط في المتدرج الا يقل سنه عن اربعة عشر عاما'.

Claim 2 [UNSUPPORTED]
Statement: نصت المادة (28) من القانون رقم 14 لسنة 2025 على أن الحد الأدنى لسن المتدرج هو أربعة عشر عاماً.
Reason: While Article (28) does specify the minimum age as fourteen, the provided context does not mention that the law is 'Law No. 14 of 2025'. The text only mentions the date of the Official Gazette (May 3, 2025).

---

labour-045 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: ما الأحكام التي تسري على المتدرجين بشأن الإجازات وساعات العمل وفترات الراحة؟
Answer: بناءً على النصوص القانونية المقدمة، تسري على المتدرجين الأحكام الخاصة بالإجازات، وساعات العمل، وفترات الراحة المنصوص عليها في القانون [1]، وذلك مع عدم الإخلال بأحكام الفصل الرابع من الباب الثاني من الكتاب المشار إليه في ذات المادة [1].

هذا التفسير مستند إلى المادة رقم (31) من قانون العمل رقم 14 لسنة 2025 [1].

يرجى العلم أن هذه الإجابة لا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: تسري على المتدرجين الأحكام الخاصة بالإجازات وساعات العمل وفترات الراحة المنصوص عليها في القانون.
Reason: This is explicitly stated in Article (31), which says: 'تسري علي المتدرجين الاحكام الخاصة بالاجازات ، وساعات العمل ، وفترات الراحة المنصوص عليها في هذا القانون'.

Claim 2 [SUPPORTED]
Statement: تطبق الأحكام الخاصة بالمتدرجين مع عدم الإخلال بأحكام الفصل الرابع من الباب الثاني من الكتاب المشار إليه في المادة القانونية.
Reason: This is explicitly stated in Article (31), which begins with: 'مع عدم الاخلال باحكام الفصل الرابع من الباب الثاني من هذا الكتاب'.

Claim 3 [UNSUPPORTED]
Statement: يستند هذا التفسير إلى المادة رقم (31) من قانون العمل رقم 14 لسنة 2025.
Reason: While the text mentions Article (31) and the date May 2025, it does not explicitly state that the law is 'Law No. 14 of 2025'.

Claim 4 [UNSUPPORTED]
Statement: هذه الإجابة لا تمثل استشارة قانونية ملزمة.
Reason: The provided context consists of legal text from an official gazette; it does not contain any disclaimer stating that the answer is not a binding legal consultation.

---

labour-057 | faithfulness=0.5000 | claims=2 | supported=1 | unsupported=1
Question: كل كم مدة يجب على الجهات التي تزاول عمليات التشغيل موافاة الوزارة ببيانات ونتائج أعمالها؟
Answer: تلتزم جميع الجهات التي تزاول عمليات التشغيل بالداخل والخارج بأن توافي الوزارة المختصة ببيانات ونتائج أعمالها على الأقل كل ستة أشهر، وذلك وفقاً للمادة (51) من قانون العمل رقم 14 لسنة 2025 [1].

Claim 1 [SUPPORTED]
Statement: تلتزم جميع الجهات التي تزاول عمليات التشغيل بالداخل والخارج بموافاة الوزارة المختصة ببيانات ونتائج أعمال هذه الجهات على الأقل كل ستة أشهر.
Reason: This is directly stated in Article (51), which mandates that all entities operating employment services internally and externally must provide the competent ministry with data and results of their work at least every six months.

Claim 2 [UNSUPPORTED]
Statement: تأتي هذه الالتزامات وفقاً للمادة (51) من قانون العمل رقم 14 لسنة 2025.
Reason: While the context mentions Article (51) and a date of May 3, 2025, it does not explicitly state that the law is 'Labor Law No. 14 of 2025'.

---

labour-058 | faithfulness=0.5000 | claims=4 | supported=2 | unsupported=2
Question: هل يجوز ممارسة إلحاق المصريين بالعمل إلكترونياً دون ترخيص؟
Answer: لا يجوز ممارسة عمليات إلحاق المصريين بالعمل بالداخل والخارج إلكترونياً (سواء من خلال مواقع أو صفحات أو منصات إلكترونية) إلا بعد الحصول على ترخيص بذلك من الوزارة المختصة، وذلك وفقاً للمادة (52) من القانون رقم 14 لسنة 2025 [1].

ويُستثنى من هذا الالتزام بالحصول على الترخيص وكالات التشغيل الخاصة التي تتخذ شكل (الشركة المساهمة، أو التوصية بالأسهم، أو ذات المسؤولية المحدودة أو الشخص الواحد) والمرخص لها من الوزارة المختصة، والمشار إليها في البند (3) من المادة (40) [1]، [4].

يرجى العلم أن هذه الإجابة تستند إلى النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.

Claim 1 [SUPPORTED]
Statement: لا يجوز ممارسة عمليات إلحاق المصريين بالعمل بالداخل والخارج إلكترونياً سواء من خلال مواقع أو صفحات أو منصات إلكترونية إلا بعد الحصول على ترخيص من الوزارة المختصة.
Reason: This is directly stated in Article (52), which prohibits the electronic practice of recruiting Egyptians inside and outside the country via websites, pages, or platforms without a license from the competent ministry.

Claim 2 [UNSUPPORTED]
Statement: تنص المادة (52) من القانون رقم 14 لسنة 2025 على ضرورة الحصول على ترخيص من الوزارة المختصة لممارسة عمليات إلحاق المصريين بالعمل إلكترونياً.
Reason: While Article (52) does require a license for electronic recruitment, the provided context does not mention that this is 'Law No. 14 of 2025'; it only mentions the Official Gazette date of May 3, 2025.

Claim 3 [SUPPORTED]
Statement: تُستثنى وكالات التشغيل الخاصة التي تتخذ شكل الشركة المساهمة أو التوصية بالأسهم أو ذات المسؤولية المحدودة أو الشخص الواحد من الالتزام بالحصول على ترخيص إضافي إذا كانت مرخص لها من الوزارة المختصة والمشار إليها في البند (3) من المادة (40).
Reason: Article (52) explicitly exempts the employment agencies referred to in item (3) of Article (40), and Article (40) item (3) defines these agencies as those taking the form of joint-stock companies, partnerships limited by shares, limited liability companies, or single-person companies licensed by the competent ministry.

Claim 4 [UNSUPPORTED]
Statement: تستند هذه الإجابة إلى النصوص المقدمة ولا تمثل استشارة قانونية ملزمة.
Reason: This is a meta-statement about the nature of the response and is not a fact that can be inferred from the provided legal text of the articles.

====================================================================================================
(.venv)
