from django.core.management.commands.runserver import Command as RunServerCommand

class Command(RunServerCommand):
    help = 'Start the development server on 0.0.0.0:8000 by default'

    def add_arguments(self, parser):
        super().add_arguments(parser)
        # Override the default addrport to 0.0.0.0:8000
        parser.set_defaults(addrport='0.0.0.0:8000')

    def handle(self, *args, **options):
        # If no addrport is specified, use 0.0.0.0:8000
        if not options.get('addrport') or options['addrport'] == '127.0.0.1:8000':
            options['addrport'] = '0.0.0.0:8000'

        super().handle(*args, **options)