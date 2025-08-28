def generate_explanation(results: dict, panel: str) -> str:
    """
    입력된 검사 결과와 panel명을 기반으로 간단한 설명 생성
    """
    explanation_parts = []

    if panel == "CBC":
        wbc = float(results.get("WBC", 0))
        neutro = float(results.get("Neutrophils", 0))
        eosino = float(results.get("Eosinophils", 0))
        platelet = float(results.get("Platelet Count", 0))

        if wbc < 4:
            explanation_parts.append("백혈구 수치가 낮습니다.")
        elif wbc > 11:
            explanation_parts.append("백혈구 수치가 높습니다.")

        if neutro < 40:
            explanation_parts.append("중성구 수치가 낮습니다.")
        elif neutro > 70:
            explanation_parts.append("중성구 수치가 높습니다.")

        if eosino > 5:
            explanation_parts.append("호산구 수치가 높습니다.")

        if platelet < 150:
            explanation_parts.append("혈소판 수치가 낮습니다.")
        elif platelet > 450:
            explanation_parts.append("혈소판 수치가 높습니다.")

    if not explanation_parts:
        return "검사 수치는 정상 범위입니다."

    return " ".join(explanation_parts)
