from django.core.management.base import BaseCommand
from cases.models import Case, CaseItem


class Command(BaseCommand):
    help = "Генерация диапазонов отдельно для каждого кейса"

    def handle(self, *args, **kwargs):
        SCALE = 10000000

        cases = Case.objects.all()

        for case in cases:
            self.stdout.write(
                self.style.WARNING(
                    f"\nОбрабатываем кейс: {case.name}"
                )
            )

            current_start = 1

            case_items = CaseItem.objects.filter(
                case=case
            ).order_by("id")

            for case_item in case_items:
                chance = float(case_item.chance)

                range_size = int((chance / 100) * SCALE)

                case_item.range_from = current_start
                case_item.range_to = current_start + range_size - 1
                case_item.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f"{case_item.item.weapon_name} | "
                        f"{case_item.item.skin_name}: "
                        f"{case_item.range_from} - "
                        f"{case_item.range_to}"
                    )
                )

                current_start = case_item.range_to + 1

        self.stdout.write(
            self.style.SUCCESS(
                "\nДиапазоны успешно сгенерированы"
            )
        )