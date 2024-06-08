from pydantic.v1 import BaseModel


class BaseToolInput(BaseModel):
    @classmethod
    def class_parameters_as_string(cls) -> str:
        explanation = []
        for field_name, field_info in cls.__fields__.items():
            # field_type = field_info.type_
            description = field_info.field_info.description or ""
            explanation.append(f"{field_name} - {description}")
        return "\n".join(explanation)